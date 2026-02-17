import { Component } from '@angular/core';

@Component({
  selector: 'app-actualiza-carta-digital',
  standalone: true,
  imports: [],
  templateUrl: './actualiza-carta-digital.html',
  styleUrls: ['./actualiza-carta-digital.css']
})
export class ActualizaCartaDigital {
  readonly imageUrl = 'assets/mockup/actualiza-comida.jpg';
  readonly googleReviewsUrl = 'assets/mockup/reseñagoogle.png';

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
