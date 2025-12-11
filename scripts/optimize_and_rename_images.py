import os
from PIL import Image

# Define paths
base_dir = r"d:\visualStudioCodeFiles\photobertWebsite"
source_dir = os.path.join(base_dir, "assets", "home")
output_dir = os.path.join(source_dir, "optimized")

# Create output directory if it doesn't exist
if not os.path.exists(output_dir):
    os.makedirs(output_dir)
    print(f"Created directory: {output_dir}")

# List of specific files to process (to ensure we process the right ones)
files_to_process = [
    "DSC_0188-2.jpg",
    "DSCF9175-2.jpg",
    "DSCF9340-2.jpg",
    "DSCF9467-2.jpg",
    "DSCF9747-2.jpg"
]

# Process each file
for i, filename in enumerate(files_to_process):
    source_path = os.path.join(source_dir, filename)
    
    # New filename: background-1.jpg, background-2.jpg, etc.
    new_filename = f"background-{i+1}.jpg"
    output_path = os.path.join(output_dir, new_filename)
    
    if os.path.exists(source_path):
        try:
            print(f"Processing {filename} -> {new_filename}...")
            
            with Image.open(source_path) as img:
                # Calculate new dimensions preserving aspect ratio
                # Target max width: 2500px 
                max_width = 2500
                width_percent = (max_width / float(img.size[0]))
                
                # Only resize if the image is larger than the target
                if width_percent < 1:
                    h_size = int((float(img.size[1]) * float(width_percent)))
                    img = img.resize((max_width, h_size), Image.Resampling.LANCZOS)
                
                # Save optimized version
                img.save(output_path, "JPEG", quality=85, optimize=True)
                
            original_size = os.path.getsize(source_path) / (1024 * 1024)
            new_size = os.path.getsize(output_path) / (1024 * 1024)
            print(f"Done. Size reduced from {original_size:.2f}MB to {new_size:.2f}MB")
            
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    else:
        print(f"Warning: Source file not found: {source_path}")

print("Optimization complete.")
