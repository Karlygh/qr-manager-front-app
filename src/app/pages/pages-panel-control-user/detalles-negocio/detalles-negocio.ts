// detalles-negocio.ts

import { Component, inject, ChangeDetectionStrategy, computed, isDevMode, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router'; 
import { map, switchMap, catchError, startWith } from 'rxjs/operators';
import { of } from 'rxjs';
import { BusinessService } from '../../../services/business.service';
import { Business } from '../../../shared/models/business.model'; 

@Component({
  selector: 'app-detalles-negocio', 
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './detalles-negocio.html',
  styleUrls: ['./detalles-negocio.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetallesNegocioComponent {
  
  private readonly route = inject(ActivatedRoute);
  private readonly businessService = inject(BusinessService);

  readonly error = signal<boolean>(false);

  // Flujo reactivo declarativo
  readonly negocio = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('id')),
      switchMap(id => {
        if (!id) return of(null);
        this.error.set(false);
        return this.businessService.getBusinessById(id).pipe(
          catchError(err => {
            this.error.set(true);
            this.logError(err);
            return of(null);
          })
        );
      }),
      startWith(undefined)
    )
  );

  // Computed values
  readonly cargando = computed(() => this.negocio() === undefined);
  readonly puedeMostrarContenido = computed(() => this.negocio() !== null && this.negocio() !== undefined);
  readonly rutaPanelControl = computed(() => {
    const id = this.negocio()?.id;
    return id ? ['/panel-control-business', id] : null;
  });

  private logError(err: any): void {
    if (isDevMode()) {
      console.error('Error al cargar negocio:', {
        status: err.status,
        url: err.url,
        error: err.error
      });
    }
  }
}
