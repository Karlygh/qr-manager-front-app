import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocialNetwork, SocialNetworkService } from '../../../services/social-network.service';

@Component({
  selector: 'app-google-opiniones',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './google-opiniones.html',
  styleUrls: ['./google-opiniones.css'],
})
export class GoogleOpiniones implements OnInit {
  private destroyRef = inject(DestroyRef);

  // Signals for state management
  public businessId = signal<number | null>(null);
  public googleReviews = signal<SocialNetwork[]>([]);
  public originalReviews = signal<SocialNetwork[]>([]);
  public reviewsToDelete = signal<number[]>([]);
  public newReview = signal<Omit<SocialNetwork, 'id'>>({ businessId: 0, name: 'Google', url: '' });
  public isEditing = signal<boolean>(false);
  public isLoading = signal<boolean>(true);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  // Computed signals
  public hasReviews = computed(() => this.googleReviews().length > 0);
  public reviewsCount = computed(() => this.googleReviews().length);

  constructor(
    private socialNetworkService: SocialNetworkService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        console.log('Parámetros de ruta recibidos:', params);

        // Intentar obtener el businessId de diferentes formas
        const idParam = params['businessId'] || params['id'];

        if (idParam && !isNaN(Number(idParam)) && Number(idParam) > 0) {
          this.businessId.set(Number(idParam));
          this.newReview.update(review => ({ ...review, businessId: Number(idParam) }));
          console.log('BusinessId establecido:', this.businessId());
          this.loadGoogleReviews();
        } else {
          console.error('ID de negocio no válido:', idParam);
          this.errorMessage.set(`Error: No se encontró un ID de negocio válido en la URL. Parámetro recibido: ${idParam}`);
          this.isLoading.set(false);
        }
      });
  }

  loadGoogleReviews(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    const currentBusinessId = this.businessId();
    if (!currentBusinessId) return;

    this.socialNetworkService.getSocialNetworksByBusinessId(currentBusinessId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (networks) => {
          // Filtrar solo las que son "Google"
          const filteredReviews = networks.filter((n) => n.name === 'Google');
          this.googleReviews.set(filteredReviews);
          this.originalReviews.set(JSON.parse(JSON.stringify(filteredReviews)));
          this.reviewsToDelete.set([]);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar Google Reseñas:', err);
          this.errorMessage.set('No se pudieron cargar las reseñas de Google.');
          this.googleReviews.set([]);
          this.isLoading.set(false);
        },
      });
  }

  addReview(): void {
    const currentReview = this.newReview();
    if (!currentReview.url?.trim()) {
      this.errorMessage.set('La URL es obligatoria.');
      return;
    }

    // Validar que tenemos un businessId válido
    const currentBusinessId = this.businessId();
    if (!currentBusinessId || currentBusinessId <= 0) {
      this.errorMessage.set('Error: ID de negocio no válido. Por favor, recarga la página.');
      return;
    }

    // Validar longitud de URL (máximo 255 caracteres según el backend)
    if (currentReview.url.length > 255) {
      this.errorMessage.set(`La URL es demasiado larga (${currentReview.url.length} caracteres). El máximo permitido es 255 caracteres.`);
      return;
    }

    if (!this.isValidUrl(currentReview.url)) {
      this.errorMessage.set('Por favor, introduce una URL válida de Google (debe comenzar con http:// o https://).');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Estrategia mejorada: intentar crear directamente, si falla por duplicado, actualizar existente
    this.isLoading.set(true);

    // Primero intentar crear la nueva reseña
    this.socialNetworkService.createSocialNetwork(currentReview)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (review) => {
          console.log('Google Reseña creada:', review);
          this.googleReviews.update(reviews => [...reviews, review]);
          this.originalReviews.update(reviews => [...reviews, review]);
          this.newReview.set({ businessId: currentBusinessId, name: 'Google', url: '' });
          this.isLoading.set(false);
          this.showSuccess('Enlace de Google Reseñas añadido correctamente.');
        },
        error: (err) => {
          console.log('Error al crear, intentando estrategia alternativa:', err);
          
          // Si falla por duplicado, usar estrategia de actualización
          if (err.status === 400 && err.error?.details?.includes('duplicate key')) {
            this.handleDuplicateError(currentReview, currentBusinessId);
          } else {
            this.handleGeneralError(err);
          }
        },
      });
  }

  private handleDuplicateError(currentReview: any, currentBusinessId: number): void {
    console.log('Manejando error de duplicado, usando estrategia de actualización');
    
    const currentReviews = this.googleReviews();
    
    // Si no hay reseñas existentes, intentar sincronización completa
    if (currentReviews.length === 0) {
      this.syncFullList([currentReview], currentBusinessId);
      return;
    }

    // Buscar la reseña de Google existente para actualizarla
    const existingGoogleReview = currentReviews.find(r => r.name === 'Google');
    
    if (existingGoogleReview && existingGoogleReview.id) {
      // Actualizar la reseña existente con la nueva URL
      const updatedReview = { ...existingGoogleReview, url: currentReview.url };
      
      this.socialNetworkService.updateSocialNetwork(existingGoogleReview.id, { url: currentReview.url })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (updated) => {
            console.log('Google Reseña actualizada:', updated);
            // Reemplazar en la lista
            const updatedList = currentReviews.map(r => r.id === existingGoogleReview.id ? updated : r);
            this.googleReviews.set(updatedList);
            this.originalReviews.set(JSON.parse(JSON.stringify(updatedList)));
            this.newReview.set({ businessId: currentBusinessId, name: 'Google', url: '' });
            this.isLoading.set(false);
            this.showSuccess('Enlace de Google Reseñas actualizado correctamente.');
          },
          error: (updateErr) => {
            console.error('Error al actualizar reseña existente:', updateErr);
            // Si la actualización también falla, intentar sincronización completa
            this.syncFullList([...currentReviews, currentReview], currentBusinessId);
          }
        });
    } else {
      // Si no hay reseña de Google existente, intentar sincronización completa
      this.syncFullList([...currentReviews, currentReview], currentBusinessId);
    }
  }

  private syncFullList(reviews: any[], currentBusinessId: number): void {
    console.log('Intentando sincronización completa como último recurso');
    
    this.socialNetworkService.saveAllSocialNetworks(currentBusinessId, reviews)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (savedReviews) => {
          console.log('Sincronización completa exitosa:', savedReviews);
          const googleReviews = savedReviews.filter((n) => n.name === 'Google');
          this.googleReviews.set(googleReviews);
          this.originalReviews.set(JSON.parse(JSON.stringify(googleReviews)));
          this.newReview.set({ businessId: currentBusinessId, name: 'Google', url: '' });
          
          // Determinar si estamos en modo edición o añadiendo
          if (this.isEditing()) {
            this.finalizeSave();
          } else {
            this.isLoading.set(false);
            this.showSuccess('Enlace de Google Reseñas sincronizado correctamente.');
          }
        },
        error: (syncErr) => {
          console.error('Error en sincronización completa:', syncErr);
          this.handleGeneralError(syncErr);
        }
      });
  }

  private handleGeneralError(err: any): void {
    console.error('Error general:', err);
    
    if (err.status === 0) {
      this.errorMessage.set('Error de conexión. Verifica que el backend esté funcionando.');
    } else if (err.status === 400) {
      if (err.error?.details) {
        this.errorMessage.set(`Error de validación: ${err.error.details}`);
      } else if (err.error?.message) {
        this.errorMessage.set(`Error: ${err.error.message}`);
      } else {
        this.errorMessage.set('Datos inválidos. Verifica que la URL tenga menos de 255 caracteres.');
      }
    } else if (err.status === 500) {
      this.errorMessage.set('Error del servidor. Por favor, inténtalo de nuevo.');
    } else if (err.error && typeof err.error === 'string') {
      this.errorMessage.set(`Error: ${err.error}`);
    } else if (err.error?.message) {
      this.errorMessage.set(`Error: ${err.error.message}`);
    } else {
      this.errorMessage.set('Error al crear el enlace de Google Reseñas. Por favor, inténtalo de nuevo.');
    }
    this.isLoading.set(false);
  }

  markForDeletion(reviewId: number | undefined): void {
    if (!reviewId) {
      this.errorMessage.set('ID de reseña no válido.');
      return;
    }

    const currentToDelete = this.reviewsToDelete();
    if (!currentToDelete.includes(reviewId)) {
      this.reviewsToDelete.set([...currentToDelete, reviewId]);
      console.log('Reseñas marcadas para eliminar:', this.reviewsToDelete());
    }
  }

  isMarkedForDeletion(reviewId: number | undefined): boolean {
    return reviewId ? this.reviewsToDelete().includes(reviewId) : false;
  }

  cancelDeletion(reviewId: number | undefined): void {
    if (!reviewId) return;

    const currentToDelete = this.reviewsToDelete();
    const index = currentToDelete.indexOf(reviewId);
    if (index > -1) {
      this.reviewsToDelete.set(currentToDelete.filter(id => id !== reviewId));
    }
  }

  saveAllChanges(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const currentReviews = this.googleReviews();
    const currentToDelete = this.reviewsToDelete();
    
    // Si no hay cambios para guardar
    if (currentToDelete.length === 0) {
      // Solo actualizar URLs modificadas
      this.updateModifiedReviews(currentReviews);
      return;
    }

    // Validar URLs antes de sincronizar
    const finalList = currentReviews.filter(
      (r) => !currentToDelete.includes(r.id!)
    );
    const invalidReview = finalList.find((r) => !this.isValidUrl(r.url));
    if (invalidReview) {
      this.errorMessage.set('La URL no es válida.');
      return;
    }

    // Estrategia de eliminación real: eliminar cada elemento marcado del backend
    this.isLoading.set(true);
    this.performRealDeletions(currentToDelete, finalList);
  }

  private performRealDeletions(toDelete: number[], remainingReviews: any[]): void {
    if (toDelete.length === 0) {
      // Si no hay más que eliminar, actualizar las URLs restantes
      this.updateModifiedReviews(remainingReviews);
      return;
    }

    const reviewIdToDelete = toDelete[0];
    const remainingDeletions = toDelete.slice(1);

    console.log(`Eliminando reseña con ID: ${reviewIdToDelete}`);

    this.socialNetworkService.deleteSocialNetwork(reviewIdToDelete)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log(`Reseña ${reviewIdToDelete} eliminada correctamente`);
          // Actualizar estado local inmediatamente
          this.googleReviews.set(this.googleReviews().filter(r => r.id !== reviewIdToDelete));
          
          // Continuar con el siguiente elemento
          this.performRealDeletions(remainingDeletions, remainingReviews.filter(r => r.id !== reviewIdToDelete));
        },
        error: (err) => {
          console.error(`Error al eliminar reseña ${reviewIdToDelete}:`, err);
          this.errorMessage.set(`Error al eliminar una reseña: ${err.error?.message || err.message || 'Error desconocido'}`);
          this.isLoading.set(false);
        }
      });
  }

  private updateModifiedReviews(reviews: any[]): void {
    // Encontrar reseñas que han sido modificadas (comparar con original)
    const originalReviews = this.originalReviews();
    const modifiedReviews: { id: number; url: string }[] = [];

    reviews.forEach(review => {
      const original = originalReviews.find(orig => orig.id === review.id);
      if (original && original.url !== review.url) {
        modifiedReviews.push({ id: review.id!, url: review.url });
      }
    });

    if (modifiedReviews.length === 0) {
      // No hay modificaciones, finalizar
      this.finalizeSave();
      return;
    }

    // Actualizar cada reseña modificada
    this.updateReviewsSequentially(modifiedReviews, reviews);
  }

  private updateReviewsSequentially(modifiedReviews: { id: number; url: string }[], finalReviews: any[]): void {
    if (modifiedReviews.length === 0) {
      // Todas las actualizaciones completas
      this.finalizeSave();
      return;
    }

    const { id, url } = modifiedReviews[0];
    const remainingUpdates = modifiedReviews.slice(1);

    console.log(`Actualizando reseña ${id} con nueva URL: ${url}`);

    this.socialNetworkService.updateSocialNetwork(id, { url })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          console.log(`Reseña ${id} actualizada correctamente`);
          // Actualizar estado local
          const updatedList = this.googleReviews().map(r => r.id === id ? updated : r);
          this.googleReviews.set(updatedList);
          
          // Continuar con el siguiente
          this.updateReviewsSequentially(remainingUpdates, finalReviews);
        },
        error: (err) => {
          console.error(`Error al actualizar reseña ${id}:`, err);
          this.errorMessage.set(`Error al actualizar una reseña: ${err.error?.message || err.message || 'Error desconocido'}`);
          this.isLoading.set(false);
        }
      });
  }

  private finalizeSave(): void {
    // Actualizar los datos originales con el estado actual después de las operaciones reales
    this.originalReviews.set(JSON.parse(JSON.stringify(this.googleReviews())));
    
    this.isEditing.set(false);
    this.reviewsToDelete.set([]);
    this.showSuccess('Cambios guardados correctamente.');
    this.isLoading.set(false);
  }

  toggleEditing(): void {
    if (this.isEditing()) {
      this.saveAllChanges();
    } else {
      this.isEditing.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);
      this.reviewsToDelete.set([]);
    }
  }

  cancelEditing(): void {
    this.googleReviews.set(JSON.parse(JSON.stringify(this.originalReviews())));
    this.reviewsToDelete.set([]);
    this.isEditing.set(false);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
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
