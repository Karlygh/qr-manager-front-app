import { Component } from '@angular/core';

@Component({
  selector: 'app-alergenos-carta-digital',
  standalone: true,
  imports: [],
  templateUrl: './alergenos-carta-digital.html',
  styleUrls: ['./alergenos-carta-digital.css']
})
export class AlergenosCartaDigital {
  
  readonly allergenImageUrl = 'assets/mockup/alergenos-carta-digital.png';

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    console.warn('Error cargando imagen de alérgenos:', img.src);
  }
}