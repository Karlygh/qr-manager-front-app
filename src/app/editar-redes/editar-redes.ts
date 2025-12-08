import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router'; // Importante para obtener el ID de la URL
import { SocialNetwork, SocialNetworkService } from '../../app/services/social-network.service';

@Component({
  selector: 'app-editar-redes',
  standalone: true,
  // Necesitas CommonModule para directivas (*ngIf, *ngFor) y FormsModule para ngModel
  imports: [CommonModule, FormsModule], 
  templateUrl: './editar-redes.html',
  styleUrl: './editar-redes.css'
})
export class EditarRedesComponent implements OnInit {
  
  public businessId!: number; 
  public socialNetworks: SocialNetwork[] = [];
  // Inicializamos la nueva red con un placeholder para el businessId
  public newNetwork: Omit<SocialNetwork, 'id'> = { businessId: 0, name: '', url: '' };
  public isEditing: boolean = false;
  public isLoading: boolean = true;
  public errorMessage: string | null = null;
  public successMessage: string | null = null;

  constructor(
    private socialNetworkService: SocialNetworkService,
    private route: ActivatedRoute // Inyectamos ActivatedRoute
  ) { }

  ngOnInit(): void {
    // 1. Obtenemos el businessId de la URL
    this.route.params.subscribe(params => {
        const idParam = params['businessId'];
        if (idParam) {
            this.businessId = Number(idParam);
            this.newNetwork.businessId = this.businessId; // Configuramos el businessId para la nueva red
            this.loadSocialNetworks(); // 2. Cargamos los datos
        } else {
            this.errorMessage = 'Error: No se encontró el ID del negocio en la URL.';
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
    if (!this.newNetwork.name || !this.newNetwork.url) {
      this.errorMessage = 'El nombre y la URL son obligatorios.';
      return;
    }

    this.errorMessage = null;
    this.socialNetworkService.createSocialNetwork(this.newNetwork).subscribe({
      next: (network) => {
        this.socialNetworks.push(network);
        // Limpiamos el formulario para la próxima adición
        this.newNetwork = { businessId: this.businessId, name: '', url: '' }; 
        this.showSuccess('Red social añadida correctamente.');
      },
      error: (err) => {
        console.error('Error al añadir red social:', err);
        this.errorMessage = 'Error al crear la red social.';
      }
    });
  }

  deleteNetwork(networkId: number | undefined): void {
    if (!networkId) return;

    this.errorMessage = null;
    this.socialNetworkService.deleteSocialNetwork(networkId).subscribe({
      next: () => {
        // Eliminamos la red social del array local
        this.socialNetworks = this.socialNetworks.filter(n => n.id !== networkId); 
        this.showSuccess('Red social eliminada.');
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        this.errorMessage = 'Error al eliminar la red social.';
      }
    });
  }
  
  // Usamos saveAll para guardar las modificaciones masivas (URLs editadas).
  saveAllChanges(): void {
    this.errorMessage = null;
    
    // Aseguramos que todas las redes sociales tengan el businessId antes de enviar.
    const networksToSave = this.socialNetworks.map(n => ({...n, businessId: this.businessId}));
    
    this.socialNetworkService.saveAllSocialNetworks(this.businessId, networksToSave).subscribe({
      next: () => {
        this.isEditing = false; // Desactivamos el modo edición al guardar
        this.showSuccess('Cambios guardados correctamente.');
        this.loadSocialNetworks();
      },
      error: (err) => {
        console.error('Error al guardar todo:', err);
        this.errorMessage = 'Error al guardar los cambios en las redes sociales.';
      }
    });
  }

  toggleEditing(): void {
    // Si ya estamos editando y el usuario presiona el botón, guardamos los cambios.
    if (this.isEditing) {
      this.saveAllChanges();
    } else {
      this.isEditing = true;
    }
  }
  
  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = null, 3000); // Oculta el mensaje después de 3 segundos
  }
}