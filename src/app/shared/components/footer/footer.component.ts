import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface FooterLink {
  label: string;
  path: string;
}

interface MenuSection {
  title: string;
  links: FooterLink[];
  showContact?: boolean;
}

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

interface ContactItem {
  label: string;
  url: string;
}

@Component({
  selector: 'shared-footer',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  // Año actual para el copyright
  currentYear = signal(new Date().getFullYear());

  // Redes sociales
  readonly socialItems: SocialLink[] = [
    { platform: 'Facebook', url: 'https://www.facebook.com/profile.php?id=1000000000000', icon: 'fab fa-facebook-f' },
    { platform: 'Twitter', url: 'https://www.twitter.com', icon: 'fab fa-twitter' },
    { platform: 'Instagram', url: 'https://www.instagram.com/cleancoderscadiz', icon: 'fab fa-instagram' }
  ];

  // Items de contacto dinámicos
  readonly contactItems = signal<ContactItem[]>([
    { 
      label: 'cleancoderscadiz@gmail.com', 
      url: 'mailto:cleancoderscadiz@gmail.com' 
    },
    { 
      label: '+34 123 456 789', 
      url: 'tel:+34123456789' 
    }
  ]);

  // Secciones del menú
  readonly menuSections: MenuSection[] = [
    {
      title: 'Información Rápida',
      links: [
        { label: 'Home', path: '/home' },
        { label: 'Tu Restaurante', path: '/tu-restaurante' },
        { label: 'Precios', path: '/precios' },
        { label: 'Preguntas Frecuentes', path: '/faq' }
      ]
    },
    {
      title: 'Soporte',
      showContact: true,
      links: [
        { label: 'Contacto', path: '/contacto' },
        { label: 'Términos de Servicio', path: '/terminos' },
        { label: 'Política de Privacidad', path: '/privacidad' }
      ]
    }
  ];
}