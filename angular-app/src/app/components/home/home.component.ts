import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  backgroundImage: string = '';
  
  // Array of background images - randomly selected on each page load
  private backgroundImages: string[] = [
    'DSC_0188-2.jpg',
    'DSCF9175-2.jpg',
    'DSCF9340-2.jpg',
    'DSCF9467-2.jpg',
    'DSCF9747-2.jpg'
  ];

  ngOnInit(): void {
    this.setRandomBackground();
  }

  private setRandomBackground(): void {
    const randomIndex = Math.floor(Math.random() * this.backgroundImages.length);
    const selectedImage = this.backgroundImages[randomIndex];
    this.backgroundImage = `/assets/home/${selectedImage}`;
    
    // Debug logging
    console.log('Random index:', randomIndex);
    console.log('Selected image filename:', selectedImage);
    console.log('Full image path:', this.backgroundImage);
    
    // Also try to set CSS custom property as backup
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--background-image', `url('${this.backgroundImage}')`);
    }
  }

  // Method to get the background style for the template
  getBackgroundStyle(): object {
    if (!this.backgroundImage) {
      console.log('No background image set yet');
      return {};
    }
    
    const style = {
      'background-image': `url('${this.backgroundImage}')`,
      'background-size': 'cover',
      'background-position': 'center center',
      'background-attachment': 'fixed',
      'background-repeat': 'no-repeat',
      'background-color': '#f0f0f0' // Fallback color
    };
    
    console.log('Applied background style:', style);
    return style;
  }
}