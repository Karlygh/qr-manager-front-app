import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface StepItem {
  number: number;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
}

@Component({
  selector: 'app-sectionqr-cartadigital',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './sectionqr-cartadigital.html',
  styleUrls: ['./sectionqr-cartadigital.css']
})
export class SectionqrCartadigital {

  readonly steps: StepItem[] = [
    {
      number: 1,
      title: 'Configuración Rápida',
      description: 'Regístrate de forma gratuita y completa la información básica de tu establecimiento en la plataforma web.',
      imageUrl: '../../assets/mockup/qrinfo.png',
      imageAlt: 'Configuración Rápida'
    },
    {
      number: 2,
      title: 'Estructura tu Menú',
      description: 'Organiza tus platos definiendo las secciones principales (entrantes, postres, bebidas) y sus categorías.',
      imageUrl: '../../assets/mockup/gemintablet.png',
      imageAlt: 'Estructura tu Menú'
    },
    {
      number: 3,
      title: 'Detalle de Productos',
      description: 'Sube tus productos, fotos de alta calidad y descripciones, asignándolos a las categorías correspondientes.',
      imageUrl: '../../assets/mockup/paella.png',
      imageAlt: 'Detalle de Productos'
    },
    {
      number: 4,
      title: 'QR Listo para Imprimir',
      description: 'Genera automáticamente tus códigos QR desde el panel. ¡Nunca cambian, incluso si actualizas tu menú!',
      imageUrl: '../../assets/mockup/qr-portatil.png',
      imageAlt: 'QR Listo para Imprimir'
    }
  ];

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    console.warn('Error cargando imagen:', img.src);
  }
}