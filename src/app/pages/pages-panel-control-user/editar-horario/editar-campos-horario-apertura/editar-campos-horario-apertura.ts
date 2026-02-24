import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OpeningHour } from '../../../../shared/models/opening-hour.model';
import { OpeningScheduleService } from '../../../../core/services/opening-schedule.service';
import { ScheduleEditorComponent } from '../../../../shared/components/schedule-editor/schedule-editor.component';

@Component({
  selector: 'app-editar-campos-horario-apertura',
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
export class EditarCamposHorarioApertura implements OnInit {
  private route = inject(ActivatedRoute);
  openingService = inject(OpeningScheduleService);
  
  businessId: number = 1;
  schedules: OpeningHour[] = [];

  ngOnInit() {
    this.businessId = Number(this.route.snapshot.paramMap.get('businessId')) || 1;
    this.openingService.getOpeningHoursByBusiness(this.businessId).subscribe({
      next: (hours) => this.schedules = hours,
      error: (error) => console.error('Error loading schedules:', error)
    });
  }
}
