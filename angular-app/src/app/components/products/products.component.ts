import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DarkModeToggleComponent } from '../dark-mode-toggle/dark-mode-toggle.component';

@Component({
  selector: 'app-products',
  imports: [RouterModule, CommonModule, DarkModeToggleComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
  isModalOpen = false;
  selectedImage = '';
  zoomLevel = 1;
  maxZoom = 4;
  minZoom = 1;
  transformOriginX = '50%';
  transformOriginY = '50%';
  
  // Drag functionality
  isDragging = false;
  startMouseX = 0;
  startMouseY = 0;
  translateX = 0;
  translateY = 0;
  hasMoved = false;

  openModal(imagePath: string) {
    this.selectedImage = imagePath;
    this.isModalOpen = true;
    this.zoomLevel = 1;
    this.transformOriginX = '50%';
    this.transformOriginY = '50%';
    this.resetDrag();
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedImage = '';
    this.zoomLevel = 1;
    this.transformOriginX = '50%';
    this.transformOriginY = '50%';
    this.resetDrag();
  }

  private resetDrag() {
    this.isDragging = false;
    this.translateX = 0;
    this.translateY = 0;
    this.hasMoved = false;
  }

  onImageMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.startMouseX = event.clientX;
    this.startMouseY = event.clientY;
    this.hasMoved = false;
    event.preventDefault();
  }

  onImageMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    
    const deltaX = event.clientX - this.startMouseX;
    const deltaY = event.clientY - this.startMouseY;
    
    // Only start dragging if we've moved more than a few pixels
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      this.hasMoved = true;
      
      // Only allow dragging when zoomed in
      if (this.zoomLevel > 1) {
        this.translateX += deltaX;
        this.translateY += deltaY;
        this.startMouseX = event.clientX;
        this.startMouseY = event.clientY;
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  onImageMouseUp(event: MouseEvent) {
    if (!this.hasMoved) {
      // This is a click, not a drag
      event.preventDefault();
      event.stopPropagation();
      this.handleImageClick(event);
    }
    
    this.isDragging = false;
    this.hasMoved = false;
  }

  private handleImageClick(event: MouseEvent) {
    if (this.zoomLevel === this.minZoom) {
      // Zoom in to clicked location
      const img = event.target as HTMLImageElement;
      const rect = img.getBoundingClientRect();
      
      // Calculate the click position relative to the image
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Convert to percentage
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;
      
      // Update transform origin to the click position
      this.transformOriginX = `${xPercent}%`;
      this.transformOriginY = `${yPercent}%`;
      
      // Zoom in
      this.zoomLevel = 2.5;
    } else {
      // Zoom out/reset
      this.zoomLevel = this.minZoom;
      this.transformOriginX = '50%';
      this.transformOriginY = '50%';
      this.resetDrag();
    }
  }

  getImageTransform(): string {
    const scale = `scale(${this.zoomLevel})`;
    const translate = `translate(${this.translateX}px, ${this.translateY}px)`;
    return `${translate} ${scale}`;
  }
}
