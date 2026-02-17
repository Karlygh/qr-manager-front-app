import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface CardItem {
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
}

@Component({
  selector: 'app-nosotros-carta-digital',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nosotros-carta-digital.html',
  styleUrls: ['./nosotros-carta-digital.css']
})
export class NosotrosCartaDigital {
  
  readonly cards: CardItem[] = [
    {
      title: 'Se adapta a cualquier negocio',
      description: 'Desde pequeños locales hasta grandes cadenas, QR-Manager funciona para cualquier tipo de restaurante.',
      imageUrl: 'assets/mockup/QR-MANAGER.jpg',
      imageAlt: 'QR-Manager adaptado a negocios'
    },
    {
      title: 'Tan fácil que lo usarás desde el primer minuto',
      description: 'Una plataforma intuitiva, clara y rápida. Valorada con 9/10 por su facilidad de uso.',
      imageUrl: 'assets/mockup/movil-gemini-carta-digital.png',
      imageAlt: 'Interfaz sencilla QR-Manager'
    },
    {
      title: 'Soporte rápido y humano',
      description: 'Más del 95% de las consultas se responden en menos de 24 horas. Siempre tendrás ayuda cuando la necesites.',
      imageUrl: 'assets/mockup/operador.jpg',
      imageAlt: 'Soporte QR-Manager'
    }
  ];

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    console.warn('Error cargando imagen:', img.src);
  }
}