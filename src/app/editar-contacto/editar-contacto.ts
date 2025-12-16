import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BusinessService } from '../services/business.service';
import { Business } from '../models/business.model';

@Component({
  selector: 'app-editar-contacto',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './editar-contacto.html',
  styleUrl: './editar-contacto.css'
})
export class EditarContacto implements OnInit {

  businessId: string | null = null;
  businessData: Business | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  isSaving: boolean = false;
  contactForm!: FormGroup;
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.minLength(9), Validators.maxLength(9)]],
      address: ['']
    });

    this.route.params.subscribe(params => {
      this.businessId = params['businessId'] || localStorage.getItem('currentBusinessId');
      if (this.businessId) {
        localStorage.setItem('currentBusinessId', this.businessId);
        this.loadBusinessDetails(this.businessId);
      } else {
        this.error = 'No se encontró el ID del negocio.';
        this.isLoading = false;
      }
    });
  }

  loadBusinessDetails(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.businessService.getBusinessById(id).subscribe({
      next: (data: Business) => {
        this.businessData = data;
        this.contactForm.patchValue({
          name: data.name,
          description: data.description,
          email: data.email,
          phoneNumber: data.phoneNumber || '',
          address: data.address || ''
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos del negocio.';
        this.isLoading = false;
        console.error('Error:', err);
      }
    });
  }

  saveContact(): void {
    if (!this.businessId || this.contactForm.invalid) return;
    
    this.isSaving = true;
    this.error = null;

    const formData = new FormData();
    formData.append('name', this.contactForm.get('name')?.value);
    formData.append('description', this.contactForm.get('description')?.value);
    formData.append('email', this.contactForm.get('email')?.value);
    formData.append('phoneNumber', this.contactForm.get('phoneNumber')?.value);
    formData.append('address', this.contactForm.get('address')?.value);
    
    if (this.selectedFile) {
      formData.append('imageLogo', this.selectedFile);
    }

    this.businessService.updateBusiness(this.businessId, formData).subscribe({
      next: (updatedBusiness: Business) => {
        this.businessData = updatedBusiness;
        this.isSaving = false;
        this.router.navigate(['/panel-control-buisiness', this.businessId]);
      },
      error: (err) => {
        console.error('Error updating contact:', err);
        this.error = 'Error al actualizar la información de contacto';
        this.isSaving = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  goBack(): void {
    if (this.businessId) {
      this.router.navigate(['/panel-control-buisiness', this.businessId]);
    }
  }
}
