import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  exact?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  isMenuOpen = signal(false);

  navItems: NavItem[] = [
    { path: '/home', label: 'Inicio', exact: true },
    { path: '/carta-digital', label: 'Carta Digital' },
    { path: '/tu-restaurante', label: 'Tu Restaurante' },
    { path: '/precios', label: 'Precios' },
    { path: '/contacto', label: 'Contacto' }
  ];

  toggleMenu() {
    this.isMenuOpen.update(value => !value);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }
}