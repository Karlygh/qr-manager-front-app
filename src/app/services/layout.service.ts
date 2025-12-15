// src/app/services/layout.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Signal para controlar la visibilidad del navbar
  public showNavbar = signal<boolean>(true);

  setNavbarVisibility(show: boolean): void {
    this.showNavbar.set(show);
  }

  showNavbarMethod(): void {
    this.showNavbar.set(true);
  }

  hideNavbar(): void {
    this.showNavbar.set(false);
  }
}