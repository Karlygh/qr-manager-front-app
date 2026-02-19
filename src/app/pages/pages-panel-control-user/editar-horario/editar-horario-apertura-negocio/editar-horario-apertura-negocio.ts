import { Component, Input, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OpeningScheduleService, OpeningHour } from '../../../../services/opening-schedule.service';
import { ScheduleEditorComponent } from '../../../../shared/components/schedule-editor/schedule-editor.component';

@Component({
  selector: 'app-editar-horario-apertura-negocio',
  standalone: true,
  imports: [ScheduleEditorComponent],
  template: `
    <app-schedule-editor
      [businessId]="businessId"
      [schedules]="schedules"
      [service]="openingService"
      [title]="'Horarios de Apertura del Negocio'"
      [instructionText]="'Configura los horarios de apertura de tu negocio. Puedes añadir hasta 2 horarios por día para horarios partidos (ej: mañana y tarde). Los cambios se pueden guardar individualmente o todos a la vez.'"
      [backRoute]="'/panel-control-business'"
      (schedulesChange)="schedules = $event">
    </app-schedule-editor>
  `
})
export class EditarHorarioAperturaNegocio implements OnInit {
  @Input() businessId: number = 1;
  @Input() openingHours: OpeningHour[] = [];
  
  private router = inject(Router);
  openingService = inject(OpeningScheduleService);
  
  schedules: OpeningHour[] = [];

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || (typeof window !== 'undefined' ? window.history.state : {});
    
    if (state?.openingHours && state.openingHours.length > 0) {
      this.openingHours = state.openingHours;
      this.businessId = state.businessId || this.businessId;
      this.schedules = this.openingHours;
    } else if (this.openingHours.length > 0) {
      this.schedules = this.openingHours;
    } else {
      const storedBusinessId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentBusinessId') : null;
      if (storedBusinessId) {
        this.businessId = Number(storedBusinessId);
      }
      this.loadSchedule();
    }
  }

  loadSchedule() {
    this.openingService.getOpeningHoursByBusiness(this.businessId).subscribe({
      next: (hours) => this.schedules = hours,
      error: (err) => console.error('Error loading schedules:', err)
    });
  }
}
