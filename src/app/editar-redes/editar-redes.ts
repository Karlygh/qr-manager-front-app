import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { SocialNetwork, SocialNetworkService } from '../../app/services/social-network.service';

@Component({
  selector: 'app-editar-redes',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule], 
  templateUrl: './editar-redes.html',
  styleUrls: ['./editar-redes.css']
})
export class EditarRedesComponent implements OnInit {
  
  public businessId!: number; 
  public socialNetworks: SocialNetwork[] = [];
  public originalNetworks: SocialNetwork[] = []; // Copia de seguridad
  public networksToDelete: number[] = []; // IDs de redes marcadas para eliminar
  public newNetwork: Omit<SocialNetwork, 'id'> = { businessId: 0, name: '', url: '' };
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
        const idParam = params['businessId'];
        if (idParam && !isNaN(Number(idParam))) {
            this.businessId = Number(idParam);
            this.newNetwork.businessId = this.businessId;
            this.loadSocialNetworks();
        } else {
            this.errorMessage = 'Error: No se encontró un ID de negocio válido en la URL.';
            this.isLoading = false;
        }
    });
  }

  loadSocialNetworks(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.socialNetworkService.getSocialNetworksByBusinessId(this.businessId).subscribe({
      next: (networks) => {
        this.socialNetworks = networks;
        this.originalNetworks = JSON.parse(JSON.stringify(networks)); // Copia profunda
        this.networksToDelete = [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar redes sociales:', err);
        this.errorMessage = 'No se pudieron cargar las redes sociales.';
        this.socialNetworks = [];
        this.isLoading = false;
      }
    });
  }

  addNetwork(): void {
    // Validación de campos
    if (!this.newNetwork.name?.trim() || !this.newNetwork.url?.trim()) {
      this.errorMessage = 'El nombre y la URL son obligatorios.';
      return;
    }

    // Validación básica de URL
    if (!this.isValidUrl(this.newNetwork.url)) {
      this.errorMessage = 'Por favor, introduce una URL válida (debe comenzar con http:// o https://).';
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;

    console.log('Enviando red social:', this.newNetwork);

    this.socialNetworkService.createSocialNetwork(this.newNetwork).subscribe({
      next: (network) => {
        console.log('Red social creada:', network);
        this.socialNetworks.push(network);
        this.originalNetworks.push(network); // También actualizar la copia
        // Limpiamos el formulario
        this.newNetwork = { businessId: this.businessId, name: '', url: '' }; 
        this.showSuccess('Red social añadida correctamente.');
      },
      error: (err) => {
        console.error('Error completo al añadir red social:', err);
        
        // Manejo específico de diferentes tipos de errores
        if (err.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica que el backend esté funcionando.';
        } else if (err.status === 400) {
          this.errorMessage = 'Datos inválidos. Verifica el nombre y la URL.';
        } else if (err.status === 500) {
          this.errorMessage = 'Error del servidor. Por favor, inténtalo de nuevo.';
        } else if (err.error && typeof err.error === 'string') {
          this.errorMessage = `Error: ${err.error}`;
        } else if (err.error?.message) {
          this.errorMessage = `Error: ${err.error.message}`;
        } else {
          this.errorMessage = 'Error al crear la red social. Por favor, inténtalo de nuevo.';
        }
      }
    });
  }

  markForDeletion(networkId: number | undefined): void {
    if (!networkId) {
      this.errorMessage = 'ID de red social no válido.';
      return;
    }

    // Marcar para eliminar (no eliminar de la lista aún)
    if (!this.networksToDelete.includes(networkId)) {
      this.networksToDelete.push(networkId);
      console.log('Redes marcadas para eliminar:', this.networksToDelete);
    }
  }

  isMarkedForDeletion(networkId: number | undefined): boolean {
    return networkId ? this.networksToDelete.includes(networkId) : false;
  }

  cancelDeletion(networkId: number | undefined): void {
    if (!networkId) return;
    
    const index = this.networksToDelete.indexOf(networkId);
    if (index > -1) {
      this.networksToDelete.splice(index, 1);
    }
  }
  
  saveAllChanges(): void {
    this.errorMessage = null;
    this.successMessage = null;
    
    // Validamos que todas las URLs sean válidas (excepto las marcadas para eliminar)
    const invalidNetwork = this.socialNetworks.find(n => 
      !this.isMarkedForDeletion(n.id) && !this.isValidUrl(n.url)
    );
    if (invalidNetwork) {
      this.errorMessage = `La URL de "${invalidNetwork.name}" no es válida.`;
      return;
    }

    // Si hay redes marcadas para eliminar, eliminarlas primero
    if (this.networksToDelete.length > 0) {
      this.deleteMarkedNetworks();
    } else {
      this.saveRemainingNetworks();
    }
  }

  private deleteMarkedNetworks(): void {
    // Según el Swagger, solo podemos eliminar todas las redes y luego guardar las que queremos mantener
    // Filtrar las redes que NO están marcadas para eliminar
    const remainingNetworks = this.socialNetworks.filter(n => 
      !this.networksToDelete.includes(n.id!)
    );

    // Eliminar todas las redes sociales del negocio
    this.socialNetworkService.deleteAllSocialNetworks(this.businessId).subscribe({
      next: () => {
        // Luego guardar solo las redes que queremos mantener
        if (remainingNetworks.length > 0) {
          this.saveNetworksAfterDeletion(remainingNetworks);
        } else {
          // No hay redes que mantener, terminamos
          this.finalizeSave();
        }
      },
      error: (err) => {
        console.error('Error al eliminar redes sociales:', err);
        this.errorMessage = 'Error al eliminar las redes sociales.';
      }
    });
  }

  private saveNetworksAfterDeletion(networks: SocialNetwork[]): void {
    const networksToSave = networks.map(n => ({
      name: n.name,
      url: n.url,
      businessId: this.businessId
    }));
    
    this.socialNetworkService.saveAllSocialNetworks(this.businessId, networksToSave).subscribe({
      next: () => {
        this.finalizeSave();
      },
      error: (err) => {
        console.error('Error al guardar redes sociales:', err);
        this.errorMessage = 'Error al guardar las redes sociales.';
      }
    });
  }

  private finalizeSave(): void {
    this.isEditing = false;
    this.networksToDelete = [];
    this.showSuccess('Cambios guardados correctamente.');
    this.loadSocialNetworks();
  }

  private saveRemainingNetworks(): void {
    // Solo actualizar las redes existentes sin eliminar ninguna
    const networksToSave = this.socialNetworks.map(n => ({
      name: n.name,
      url: n.url,
      businessId: this.businessId
    }));
    
    this.socialNetworkService.saveAllSocialNetworks(this.businessId, networksToSave).subscribe({
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
      // Al guardar, procesar todos los cambios
      this.saveAllChanges();
    } else {
      // Al entrar en modo edición, limpiar mensajes y marcar para eliminar
      this.isEditing = true;
      this.errorMessage = null;
      this.successMessage = null;
      this.networksToDelete = [];
    }
  }

  cancelEditing(): void {
    // Restaurar la lista original y cancelar el modo edición
    this.socialNetworks = JSON.parse(JSON.stringify(this.originalNetworks));
    this.networksToDelete = [];
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