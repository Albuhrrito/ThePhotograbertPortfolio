import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
import { DarkModeToggleComponent } from '../dark-mode-toggle/dark-mode-toggle.component';

@Component({
  selector: 'app-contact',
  imports: [RouterModule, ReactiveFormsModule, CommonModule, DarkModeToggleComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  contactForm!: FormGroup;
  isSubmitting = false;
  submitMessage = '';
  submitMessageType: 'success' | 'error' | '' = '';

  // EmailJS Configuration - You'll need to replace these with your actual values
  private readonly EMAILJS_SERVICE_ID = 'service_crd938o'; // Replace with your EmailJS service ID
  private readonly EMAILJS_TEMPLATE_ID = 'template_jazkzws'; // Replace with your EmailJS template ID
  private readonly EMAILJS_PUBLIC_KEY = 'H9564ia-8mXpS7ceS'; // Replace with your EmailJS public key

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    
    // Initialize EmailJS with your public key
    emailjs.init(this.EMAILJS_PUBLIC_KEY);
  }

  private initializeForm(): void {
    this.contactForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(10)]],
      message: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.contactForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitMessage = '';
    this.submitMessageType = '';

    try {
      const formData = this.contactForm.value;
      
      // Prepare template parameters for EmailJS
      const templateParams = {
        from_name: `${formData.firstName} ${formData.lastName}`,
        from_email: formData.email,
        subject: formData.subject,
        message: formData.message,
        to_name: 'Albert Youssef', // Your name
      };

      console.log('Sending email with params:', templateParams);

      const response: EmailJSResponseStatus = await emailjs.send(
        this.EMAILJS_SERVICE_ID,
        this.EMAILJS_TEMPLATE_ID,
        templateParams
      );

      console.log('Email sent successfully:', response);
      
      this.submitMessageType = 'success';
      this.submitMessage = 'Thank you! Your message has been sent successfully. I\'ll get back to you soon!';
      this.contactForm.reset();

    } catch (error) {
      console.error('Email send failed:', error);
      
      this.submitMessageType = 'error';
      this.submitMessage = 'Sorry, there was an error sending your message. Please try again or contact me directly.';
    } finally {
      this.isSubmitting = false;
      
      // Clear message after 5 seconds
      setTimeout(() => {
        this.submitMessage = '';
        this.submitMessageType = '';
      }, 5000);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }

  // Utility methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors['minlength']) return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['email']) return 'Please enter a valid email address';
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      subject: 'Subject',
      message: 'Message'
    };
    return displayNames[fieldName] || fieldName;
  }
}