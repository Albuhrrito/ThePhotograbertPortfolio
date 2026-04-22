"""
Photograbert image pipeline.

Reads originals from ../incoming/<category>/  and produces, for each image:
  - 4 resized tiers (thumb 600w, medium 1400w, large 2400w, full 4000w)
  - WebP (primary) + JPEG (fallback) at each tier
  - LQIP (24w JPEG q40) as base64 data URI
  - EXIF (camera, lens, aperture, shutter, iso, focal length, datetime)
  - aspect ratio

Outputs:
  - ../angular-app/src/assets/<category>/{thumb,medium,large,full}/<name>.{webp,jpg}
  - ../angular-app/src/assets/manifests/<category>.json

Idempotent: skips images whose sized variants already exist and are newer than
the source. Delete ../angular-app/src/assets/<category>/ to force rebuild.
"""

from __future__ import annotations

import base64
import io
import json
import sys
import time
from dataclasses import asdict, dataclass
from fractions import Fraction
from pathlib import Path
from typing import Iterable

from PIL import ExifTags, Image, ImageOps

REPO = Path(__file__).resolve().parent.parent
INCOMING = REPO / "incoming"
NG_SRC = REPO / "angular-app" / "src"
NG_ASSETS = NG_SRC / "assets"
# Manifests go into src/app/ so they can be imported (bundled) rather than fetched.
MANIFEST_DIR = NG_SRC / "app" / "manifests"

# (incoming folder name) -> (angular assets / route slug)
# The incoming folders are singular in places; we normalize to plural URL slugs.
CATEGORY_MAP: dict[str, str] = {
    "portrait": "portraits",
    "modeling": "modeling",
    "sports": "sports",
    "street": "street",
    "product": "products",
    "graduation": "graduation",
    "hero": "hero",
    "about": "about",
}

# Fallback: if aesthetics has no incoming/ folder yet, pull source images from
# whatever's sitting in angular-app/src/assets/aesthetics/ root.
AESTHETICS_FALLBACK = NG_ASSETS / "aesthetics"

TIERS: dict[str, tuple[int, int, int]] = {
    # name: (max_width, webp_quality, jpeg_quality)
    # WebP q lower than JPEG so WebP file stays smaller on grainy/detailed photos.
    "thumb": (600, 76, 80),
    "medium": (1400, 78, 82),
    "large": (2400, 80, 85),
    "full": (4000, 82, 88),
}
LQIP_WIDTH = 24
LQIP_JPEG_QUALITY = 40

SOURCE_EXTS = {".jpg", ".jpeg", ".png"}


@dataclass
class ImageEntry:
    id: str
    alt: str
    w: int
    h: int
    ar: float
    lqip: str
    exif: dict


def _exif_tag(exif: dict, name: str):
    for tag_id, val in exif.items():
        if ExifTags.TAGS.get(tag_id) == name:
            return val
    return None


def _format_shutter(value) -> str | None:
    if value is None:
        return None
    try:
        f = Fraction(value).limit_denominator(8000)
        if f >= 1:
            return f"{float(f):.1f}s".rstrip("0").rstrip(".") + "s" if False else f"{float(f):.1f}s"
        return f"1/{int(1 / float(f))}s"
    except Exception:
        return None


def _format_aperture(value) -> str | None:
    if value is None:
        return None
    try:
        return f"f/{float(value):.1f}".rstrip("0").rstrip(".")
    except Exception:
        return None


def _format_focal(value) -> str | None:
    if value is None:
        return None
    try:
        return f"{int(round(float(value)))}mm"
    except Exception:
        return None


def _clean_lens(value) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    # Cameras with no chipped lens often report "0.0 mm f/0.0" — useless noise.
    if not s or "0.0 mm f/0.0" in s or s.lower() in {"----", "unknown"}:
        return None
    return s


def _format_date(value) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    # EXIF format is "YYYY:MM:DD HH:MM:SS". Return "YYYY-MM-DD" (date only).
    try:
        date_part = s.split(" ")[0]
        y, m, d = date_part.split(":")
        return f"{y}-{m}-{d}"
    except Exception:
        return s or None


def extract_exif(img: Image.Image) -> dict:
    raw = img.getexif()
    if not raw:
        return {}
    # Pull the sub-IFD containing the lens/exposure data, if present.
    exif = dict(raw)
    exif_ifd_id = None
    for k, name in ExifTags.TAGS.items():
        if name == "ExifOffset":
            exif_ifd_id = k
            break
    sub_ifd = {}
    if exif_ifd_id is not None and exif_ifd_id in exif:
        try:
            sub_ifd = dict(raw.get_ifd(exif_ifd_id))
        except Exception:
            sub_ifd = {}
    merged = {**exif, **sub_ifd}

    camera = _exif_tag(merged, "Model")
    make = _exif_tag(merged, "Make")
    lens = _exif_tag(merged, "LensModel") or _exif_tag(merged, "LensMake")
    aperture = _exif_tag(merged, "FNumber")
    shutter = _exif_tag(merged, "ExposureTime")
    iso = _exif_tag(merged, "ISOSpeedRatings") or _exif_tag(merged, "PhotographicSensitivity")
    focal = _exif_tag(merged, "FocalLength")
    dt = _exif_tag(merged, "DateTimeOriginal") or _exif_tag(merged, "DateTime")

    out = {
        "camera": str(camera).strip() if camera else None,
        "make": str(make).strip() if make else None,
        "lens": _clean_lens(lens),
        "aperture": _format_aperture(aperture),
        "shutter": _format_shutter(shutter),
        "iso": int(iso) if iso else None,
        "focal": _format_focal(focal),
        "date": _format_date(dt),
    }
    # Drop Nones so the manifest stays tidy.
    return {k: v for k, v in out.items() if v is not None}


def make_lqip(img: Image.Image) -> str:
    lqip = img.copy()
    lqip.thumbnail((LQIP_WIDTH, LQIP_WIDTH * 10))  # preserve aspect, clamp width
    buf = io.BytesIO()
    lqip.convert("RGB").save(buf, "JPEG", quality=LQIP_JPEG_QUALITY, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def resize_to_width(img: Image.Image, target_w: int) -> Image.Image:
    w, h = img.size
    if target_w >= w:
        return img.copy()
    ratio = target_w / w
    new = img.resize((target_w, max(1, int(h * ratio))), Image.Resampling.LANCZOS)
    return new


def _tier_paths(category_out: Path, stem: str) -> dict[str, tuple[Path, Path]]:
    """Return {tier: (webp_path, jpg_path)} for all tiers."""
    return {
        tier: (
            category_out / tier / f"{stem}.webp",
            category_out / tier / f"{stem}.jpg",
        )
        for tier in TIERS
    }


def _needs_rebuild(src: Path, category_out: Path, stem: str) -> bool:
    src_mtime = src.stat().st_mtime
    for tier in TIERS:
        for ext in ("webp", "jpg"):
            out = category_out / tier / f"{stem}.{ext}"
            if not out.exists() or out.stat().st_mtime < src_mtime:
                return True
    return False


def process_image(src: Path, category_out: Path, slug: str) -> ImageEntry:
    stem = src.stem
    for tier in TIERS:
        (category_out / tier).mkdir(parents=True, exist_ok=True)

    with Image.open(src) as raw_img:
        img = ImageOps.exif_transpose(raw_img)  # normalize rotation
        img.load()
        exif = extract_exif(raw_img)
        width, height = img.size

        lqip = make_lqip(img)

        for tier, (max_w, webp_q, jpg_q) in TIERS.items():
            sized = resize_to_width(img, max_w)
            webp_path = category_out / tier / f"{stem}.webp"
            jpg_path = category_out / tier / f"{stem}.jpg"
            rgb = sized.convert("RGB")
            rgb.save(webp_path, "WEBP", quality=webp_q, method=6)
            rgb.save(jpg_path, "JPEG", quality=jpg_q, optimize=True, progressive=True)

    return ImageEntry(
        id=stem,
        alt=_default_alt(slug),
        w=width,
        h=height,
        ar=round(width / height, 4),
        lqip=lqip,
        exif=exif,
    )


def _default_alt(slug: str) -> str:
    label = slug[:-1] if slug.endswith("s") and slug not in {"aesthetics"} else slug
    return f"Photograph by Albert Youssef — {label}"


def _source_files(folder: Path) -> Iterable[Path]:
    for p in sorted(folder.iterdir()):
        if p.is_file() and p.suffix.lower() in SOURCE_EXTS:
            yield p


def process_category(slug: str, source_folder: Path, force: bool) -> list[ImageEntry]:
    if not source_folder.exists():
        print(f"  ! source folder missing: {source_folder}")
        return []
    category_out = NG_ASSETS / slug
    entries: list[ImageEntry] = []

    srcs = list(_source_files(source_folder))
    if not srcs:
        print(f"  (no images in {source_folder})")
        return []

    for i, src in enumerate(srcs, 1):
        stem = src.stem
        needs = force or _needs_rebuild(src, category_out, stem)
        action = "build" if needs else "skip"
        print(f"  [{i:02d}/{len(srcs)}] {action}: {src.name}", flush=True)
        if needs:
            try:
                entries.append(process_image(src, category_out, slug))
            except Exception as e:
                print(f"      ERROR: {e}")
        else:
            # We still need the manifest entry — rebuild from the existing JPEG.
            large = category_out / "large" / f"{stem}.jpg"
            if large.exists():
                try:
                    with Image.open(src) as raw_img:
                        img = ImageOps.exif_transpose(raw_img)
                        img.load()
                        exif = extract_exif(raw_img)
                        width, height = img.size
                        entries.append(
                            ImageEntry(
                                id=stem,
                                alt=_default_alt(slug),
                                w=width,
                                h=height,
                                ar=round(width / height, 4),
                                lqip=make_lqip(img),
                                exif=exif,
                            )
                        )
                except Exception as e:
                    print(f"      ERROR reading metadata: {e}")
    return entries


def write_manifest(slug: str, entries: list[ImageEntry]) -> None:
    MANIFEST_DIR.mkdir(parents=True, exist_ok=True)
    out = MANIFEST_DIR / f"{slug}.json"
    payload = [asdict(e) for e in entries]
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"  -> wrote manifest: {out.relative_to(REPO)} ({len(entries)} entries)")


def main() -> int:
    force = "--force" in sys.argv
    only = None
    for arg in sys.argv[1:]:
        if arg.startswith("--only="):
            only = arg.split("=", 1)[1].split(",")

    started = time.time()

    # Regular categories with incoming/ folders.
    for incoming_name, slug in CATEGORY_MAP.items():
        if only and slug not in only:
            continue
        src = INCOMING / incoming_name
        print(f"\n[{slug}]")
        entries = process_category(slug, src, force)
        if entries:
            write_manifest(slug, entries)

    # Aesthetics fallback: use existing files sitting in angular-app/src/assets/aesthetics/
    # (the pre-existing, not-yet-curated files).
    if (only is None) or ("aesthetics" in only):
        print("\n[aesthetics] (from existing src/assets/aesthetics/*.jpg)")
        # Only process files directly in the folder (ignore tier subdirs we created).
        tier_names = set(TIERS.keys())
        source_folder = AESTHETICS_FALLBACK
        if source_folder.exists():
            files = [
                p for p in sorted(source_folder.iterdir())
                if p.is_file() and p.suffix.lower() in SOURCE_EXTS
                and p.parent.name not in tier_names
            ]
            entries = []
            for i, src in enumerate(files, 1):
                stem = src.stem
                needs = force or _needs_rebuild(src, source_folder, stem)
                action = "build" if needs else "skip"
                print(f"  [{i:02d}/{len(files)}] {action}: {src.name}", flush=True)
                try:
                    if needs:
                        entries.append(process_image(src, source_folder, "aesthetics"))
                    else:
                        with Image.open(src) as raw_img:
                            img = ImageOps.exif_transpose(raw_img)
                            img.load()
                            entries.append(
                                ImageEntry(
                                    id=stem,
                                    alt=_default_alt("aesthetics"),
                                    w=img.size[0],
                                    h=img.size[1],
                                    ar=round(img.size[0] / img.size[1], 4),
                                    lqip=make_lqip(img),
                                    exif=extract_exif(raw_img),
                                )
                            )
                except Exception as e:
                    print(f"      ERROR: {e}")
            if entries:
                write_manifest("aesthetics", entries)

    elapsed = time.time() - started
    print(f"\nDone in {elapsed:.1f}s.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
