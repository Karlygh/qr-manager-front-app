import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { SocialNetwork, SocialNetworkService } from '../../../services/social-network.service';
@Component({
  selector: 'app-google-opiniones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './google-opiniones.html',
  styleUrls: ['./google-opiniones.css']
})
export class GoogleOpiniones implements OnInit {
  
  public businessId!: number;
  public googleReviews: SocialNetwork[] = [];
  public originalReviews: SocialNetwork[] = [];
  public reviewsToDelete: number[] = [];
  public newReview: Omit<SocialNetwork, 'id'> = { businessId: 0, name: 'Google', url: '' };
  public isEditing: boolean = false;
  public isLoading: boolean = true;
  public errorMessage: string | null = null;
  public successMessage: string | null = null;

  constructor(
    private socialNetworkService: SocialNetworkService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.params.pipe(take(1)).subscribe(params => {
      console.log('Parámetros de ruta recibidos:', params);
      
      // Intentar obtener el businessId de diferentes formas
      const idParam = params['businessId'] || params['id'];
      
      if (idParam && !isNaN(Number(idParam)) && Number(idParam) > 0) {
        this.businessId = Number(idParam);
        this.newReview.businessId = this.businessId;
        console.log('BusinessId establecido:', this.businessId);
        this.loadGoogleReviews();
      } else {
        console.error('ID de negocio no válido:', idParam);
        this.errorMessage = `Error: No se encontró un ID de negocio válido en la URL. Parámetro recibido: ${idParam}`;
        this.isLoading = false;
      }
    });
  }

  loadGoogleReviews(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.socialNetworkService.getSocialNetworksByBusinessId(this.businessId).subscribe({
      next: (networks) => {
        // Filtrar solo las que son "Google"
        this.googleReviews = networks.filter(n => n.name === 'Google');
        this.originalReviews = JSON.parse(JSON.stringify(this.googleReviews));
        this.reviewsToDelete = [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar Google Reseñas:', err);
        this.errorMessage = 'No se pudieron cargar las reseñas de Google.';
        this.googleReviews = [];
        this.isLoading = false;
      }
    });
  }

  addReview(): void {
    if (!this.newReview.url?.trim()) {
      this.errorMessage = 'La URL es obligatoria.';
      return;
    }

    // Validar que tenemos un businessId válido
    if (!this.businessId || this.businessId <= 0) {
      this.errorMessage = 'Error: ID de negocio no válido. Por favor, recarga la página.';
      return;
    }

    // Asegurar que el businessId esté actualizado
    this.newReview.businessId = this.businessId;

    // Validar longitud de URL (máximo 255 caracteres según el backend)
    if (this.newReview.url.length > 255) {
      this.errorMessage = `La URL es demasiado larga (${this.newReview.url.length} caracteres). El máximo permitido es 255 caracteres.`;
      return;
    }

    if (!this.isValidUrl(this.newReview.url)) {
      this.errorMessage = 'Por favor, introduce una URL válida de Google (debe comenzar con http:// o https://).';
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;

    // Log para debugging
    console.log('Datos a enviar:', {
      name: this.newReview.name,
      url: this.newReview.url,
      businessId: this.newReview.businessId,
      urlLength: this.newReview.url.length
    });

    this.socialNetworkService.createSocialNetwork(this.newReview).subscribe({
      next: (review) => {
        console.log('Google Reseña creada:', review);
        this.googleReviews.push(review);
        this.originalReviews.push(review);
        this.newReview = { businessId: this.businessId, name: 'Google', url: '' };
        this.showSuccess('Enlace de Google Reseñas añadido correctamente.');
      },
      error: (err) => {
        console.error('Error completo al añadir Google Reseña:', err);
        console.error('Detalles del error:', err.error);
        
        if (err.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica que el backend esté funcionando.';
        } else if (err.status === 400) {
          // Intentar extraer el mensaje de error específico del backend
          if (err.error?.details) {
            this.errorMessage = `Error de validación: ${err.error.details}`;
          } else if (err.error?.message) {
            this.errorMessage = `Error: ${err.error.message}`;
          } else {
            this.errorMessage = 'Datos inválidos. Verifica que la URL tenga menos de 255 caracteres.';
          }
        } else if (err.status === 500) {
          this.errorMessage = 'Error del servidor. Por favor, inténtalo de nuevo.';
        } else if (err.error && typeof err.error === 'string') {
          this.errorMessage = `Error: ${err.error}`;
        } else if (err.error?.message) {
          this.errorMessage = `Error: ${err.error.message}`;
        } else {
          this.errorMessage = 'Error al crear el enlace de Google Reseñas. Por favor, inténtalo de nuevo.';
        }
      }
    });
  }

  markForDeletion(reviewId: number | undefined): void {
    if (!reviewId) {
      this.errorMessage = 'ID de reseña no válido.';
      return;
    }

    if (!this.reviewsToDelete.includes(reviewId)) {
      this.reviewsToDelete.push(reviewId);
      console.log('Reseñas marcadas para eliminar:', this.reviewsToDelete);
    }
  }

  isMarkedForDeletion(reviewId: number | undefined): boolean {
    return reviewId ? this.reviewsToDelete.includes(reviewId) : false;
  }

  cancelDeletion(reviewId: number | undefined): void {
    if (!reviewId) return;
    
    const index = this.reviewsToDelete.indexOf(reviewId);
    if (index > -1) {
      this.reviewsToDelete.splice(index, 1);
    }
  }

  saveAllChanges(): void {
    this.errorMessage = null;
    this.successMessage = null;
    
    const invalidReview = this.googleReviews.find(r => 
      !this.isMarkedForDeletion(r.id) && !this.isValidUrl(r.url)
    );
    if (invalidReview) {
      this.errorMessage = 'La URL no es válida.';
      return;
    }

    if (this.reviewsToDelete.length > 0) {
      this.deleteMarkedReviews();
    } else {
      this.saveRemainingReviews();
    }
  }

  private deleteMarkedReviews(): void {
    const remainingReviews = this.googleReviews.filter(r => 
      !this.reviewsToDelete.includes(r.id!)
    );

    this.socialNetworkService.deleteAllSocialNetworks(this.businessId).subscribe({
      next: () => {
        if (remainingReviews.length > 0) {
          this.saveReviewsAfterDeletion(remainingReviews);
        } else {
          this.finalizeSave();
        }
      },
      error: (err) => {
        console.error('Error al eliminar reseñas:', err);
        this.errorMessage = 'Error al eliminar las reseñas de Google.';
      }
    });
  }

  private saveReviewsAfterDeletion(reviews: SocialNetwork[]): void {
    const reviewsToSave = reviews.map(r => ({
      name: 'Google',
      url: r.url,
      businessId: this.businessId
    }));
    
    this.socialNetworkService.saveAllSocialNetworks(this.businessId, reviewsToSave).subscribe({
      next: () => {
        this.finalizeSave();
      },
      error: (err) => {
        console.error('Error al guardar reseñas:', err);
        this.errorMessage = 'Error al guardar las reseñas de Google.';
      }
    });
  }

  private finalizeSave(): void {
    this.isEditing = false;
    this.reviewsToDelete = [];
    this.showSuccess('Cambios guardados correctamente.');
    this.loadGoogleReviews();
  }

  private saveRemainingReviews(): void {
    const reviewsToSave = this.googleReviews.map(r => ({
      name: 'Google',
      url: r.url,
      businessId: this.businessId
    }));
    
    this.socialNetworkService.saveAllSocialNetworks(this.businessId, reviewsToSave).subscribe({
      next: () => {
        this.finalizeSave();
      },
      error: (err) => {
        console.error('Error al guardar cambios:', err);
        this.errorMessage = 'Error al guardar los cambios. Por favor, inténtalo de nuevo.';
      }
    });
  }

  toggleEditing(): void {
    if (this.isEditing) {
      this.saveAllChanges();
    } else {
      this.isEditing = true;
      this.errorMessage = null;
      this.successMessage = null;
      this.reviewsToDelete = [];
    }
  }

  cancelEditing(): void {
    this.googleReviews = JSON.parse(JSON.stringify(this.originalReviews));
    this.reviewsToDelete = [];
    this.isEditing = false;
    this.errorMessage = null;
    this.successMessage = null;
  }
  
  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = null, 3000);
  }

  private isValidUrl(url: string): boolean {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}