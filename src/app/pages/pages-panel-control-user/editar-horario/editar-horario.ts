import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KitchenScheduleService, KitchenHour } from '../../../services/kitchen-schedule.service';
import { ScheduleEditorComponent } from '../../../shared/components/schedule-editor/schedule-editor.component';

@Component({
  selector: 'app-editar-horario',
  standalone: true,
  imports: [ScheduleEditorComponent],
  template: `
    <app-schedule-editor
      [businessId]="businessId"
      [schedules]="schedules"
      [service]="kitchenService"
      [title]="'Horarios de Cocina'"
      [instructionText]="'Configura los horarios de cocina de tu negocio. Puedes añadir hasta 2 horarios por día para horarios partidos (ej: comida y cena). Los cambios se pueden guardar individualmente o todos a la vez.'"
      [backRoute]="'/panel-control-business'"
      (schedulesChange)="schedules = $event">
    </app-schedule-editor>
  `
})
export class EditarHorario implements OnInit {
  private route = inject(ActivatedRoute);
  kitchenService = inject(KitchenScheduleService);
  
  businessId: number = 1;
  schedules: KitchenHour[] = [];

  ngOnInit() {
    this.businessId = Number(this.route.snapshot.paramMap.get('businessId')) || 1;
    this.loadSchedules();
  }

  loadSchedules() {
    this.kitchenService.getKitchenHoursByBusiness(this.businessId).subscribe({
      next: (hours) => this.schedules = hours,
      error: (error) => console.error('Error loading schedules:', error)
    });
  }
}