import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { SectionqrCartadigital } from '../pages-navbar/carta-digital/sectionqr-cartadigital/sectionqr-cartadigital';
import { ActualizaCartaDigital } from '../pages-navbar/carta-digital/actualiza-carta-digital/actualiza-carta-digital';
import { AlergenosCartaDigital } from '../pages-navbar/carta-digital/alergenos-carta-digital/alergenos-carta-digital';
import { NosotrosCartaDigital } from "../pages-navbar/carta-digital/nosotros-carta-digital/nosotros-carta-digital";

@Component({
  standalone: true,
  imports: [RouterLink, CommonModule, RouterModule, SectionqrCartadigital, ActualizaCartaDigital, AlergenosCartaDigital, NosotrosCartaDigital], 
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit, OnDestroy {
  currentImageIndex = 0;
  autoPlayInterval: any;
  private readonly AUTO_PLAY_DELAY = 2000;

  ngOnInit() {
    this.initGallery();
    this.startAutoPlay();
  }

  initGallery() {
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        this.showImage(index);
      });
    });

    // Agregar eventos mouseover a las imágenes
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
      item.addEventListener('mouseenter', () => {
        this.showImage(index);
      });
    });
    
    // Actualizar galería al iniciar
    this.updateGallery();
  }

  showImage(index: number) {
    this.currentImageIndex = index;
    this.updateGallery();
    this.restartAutoPlay();
  }

  private updateGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const indicators = document.querySelectorAll('.indicator');

    galleryItems.forEach((item: Element, index: number) => {
      const htmlItem = item as HTMLElement;
      if (index === this.currentImageIndex) {
        htmlItem.classList.add('active');
      } else {
        htmlItem.classList.remove('active');
      }
    });

    indicators.forEach((indicator: Element, index: number) => {
      const htmlIndicator = indicator as HTMLElement;
      if (index === this.currentImageIndex) {
        htmlIndicator.classList.add('active');
      } else {
        htmlIndicator.classList.remove('active');
      }
    });
  }

  private startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % 3;
      this.updateGallery();
    }, this.AUTO_PLAY_DELAY);
  }

  private restartAutoPlay() {
    clearInterval(this.autoPlayInterval);
    this.startAutoPlay();
  }

  ngOnDestroy() {
    clearInterval(this.autoPlayInterval);
  }
}