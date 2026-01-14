import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KitchenScheduleService, KitchenHour } from '../../../services/kitchen-schedule.service';

@Component({
  selector: 'app-editar-horario',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './editar-horario.html',
  styleUrls: ['./editar-horario.css']
})
export class EditarHorario implements OnInit {
  businessId: number = 1;
  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  daySchedules: { [key: string]: KitchenHour[] } = {};
  loading = false;
  savingDay: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private kitchenScheduleService: KitchenScheduleService, 
    private router: Router, 
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.businessId = Number(this.route.snapshot.paramMap.get('businessId')) || 1;
    this.loadSchedules();
  }

  loadSchedules() {
    this.kitchenScheduleService.getKitchenHoursByBusiness(this.businessId).subscribe({
      next: (hours) => {
        if (hours && hours.length > 0) {
          this.groupSchedulesByDay(hours);
        } else {
          this.initializeEmptySchedules();
        }
      },
      error: (error) => {
        console.error('Error loading schedules:', error);
        this.initializeEmptySchedules();
      }
    });
  }

  groupSchedulesByDay(hours: KitchenHour[]) {
    this.daySchedules = {};
    
    // Inicializar todos los días
    this.days.forEach(day => {
      this.daySchedules[day] = [];
    });
    
    // Agrupar horarios existentes
    hours.forEach(hour => {
      if (!this.daySchedules[hour.day]) {
        this.daySchedules[hour.day] = [];
      }
      this.daySchedules[hour.day].push({...hour});
    });
    
    // Asegurar que cada día tenga al menos un horario por defecto
    this.days.forEach(day => {
      if (this.daySchedules[day].length === 0) {
        this.daySchedules[day] = [this.createDefaultSchedule(day)];
      }
    });
  }

  initializeEmptySchedules() {
    this.daySchedules = {};
    this.days.forEach(day => {
      this.daySchedules[day] = [this.createDefaultSchedule(day)];
    });
  }

  createDefaultSchedule(day: string): KitchenHour {
    return {
      businessId: this.businessId,
      day,
      openingTime: '09:00',
      closingTime: '22:00',
      status: true
    };
  }

  addSplitSchedule(day: string) {
    if (!this.daySchedules[day]) {
      this.daySchedules[day] = [];
    }
    if (this.daySchedules[day].length >= 2) {
      this.showError('Máximo 2 horarios por día');
      return;
    }
    this.daySchedules[day].push(this.createDefaultSchedule(day));
  }

  canAddSchedule(day: string): boolean {
    return this.daySchedules[day] && this.daySchedules[day].length < 2;
  }

  validateSchedule(schedule: KitchenHour): string | null {
    const opening = this.timeToMinutes(schedule.openingTime);
    const closing = this.timeToMinutes(schedule.closingTime);

    if (closing <= opening) {
      return 'La hora de cierre debe ser posterior a la de apertura';
    }

    if (!this.daySchedules[schedule.day]) {
      return null;
    }

    const otherSchedules = this.daySchedules[schedule.day].filter(s => s !== schedule);
    for (const other of otherSchedules) {
      const otherOpening = this.timeToMinutes(other.openingTime);
      const otherClosing = this.timeToMinutes(other.closingTime);

      if ((opening < otherClosing && closing > otherOpening)) {
        return 'Los horarios no pueden solaparse';
      }
    }
    return null;
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Guardar un horario individual = guardar TODOS los horarios del día
  saveSchedule(schedule: KitchenHour) {
    const day = schedule.day;
    const daySchedules = this.daySchedules[day];
    
    // Validar TODOS los horarios del día
    for (const s of daySchedules) {
      const validationError = this.validateSchedule(s);
      if (validationError) {
        this.showError(validationError);
        return;
      }
    }

    this.savingDay = day;
    
    // Guardar todos los horarios del día
    this.kitchenScheduleService.saveDaySchedules(this.businessId, day, daySchedules).subscribe({
      next: (response) => {
        // Actualizar los horarios con la respuesta del servidor
        const newHours: KitchenHour[] = [];
        response.intervals.forEach(interval => {
          newHours.push({
            id: interval.id,
            businessId: response.businessId,
            day: response.day,
            openingTime: this.stripSeconds(interval.startTime),
            closingTime: this.stripSeconds(interval.endTime),
            status: response.status,
            dayGroupId: response.id
          });
        });
        
        this.daySchedules[day] = newHours;
        this.savingDay = null;
        this.showSuccess('Horarios del día guardados correctamente');
      },
      error: (error) => {
        console.error('Error saving day schedules:', error);
        this.savingDay = null;
        this.showError('Error al guardar los horarios');
      }
    });
  }

  deleteSchedule(day: string, schedule: KitchenHour) {
    // Si es el único horario del día, solo limpiarlo
    if (this.daySchedules[day].length === 1) {
      this.showError('Debe haber al menos un horario por día');
      return;
    }

    // Remover del array
    const index = this.daySchedules[day].indexOf(schedule);
    if (index > -1) {
      this.daySchedules[day].splice(index, 1);
    }
    
    this.showSuccess('Horario eliminado. Recuerda guardar los cambios.');
  }

  removeScheduleFromDay(day: string, schedule: KitchenHour) {
    if (!this.daySchedules[day]) {
      this.daySchedules[day] = [];
    }
    const index = this.daySchedules[day].indexOf(schedule);
    if (index > -1) {
      this.daySchedules[day].splice(index, 1);
    }
    if (this.daySchedules[day].length === 0) {
      this.daySchedules[day] = [this.createDefaultSchedule(day)];
    }
  }

  saveAllSchedules() {
    this.loading = true;
    const allSchedules = Object.values(this.daySchedules).flat();
    
    // Validar todos los horarios
    for (const schedule of allSchedules) {
      const error = this.validateSchedule(schedule);
      if (error) {
        this.loading = false;
        this.showError(`${this.getDayName(schedule.day)}: ${error}`);
        return;
      }
    }

    this.kitchenScheduleService.saveAllKitchenHours(this.businessId, allSchedules).subscribe({
      next: (updatedHours) => {
        this.loading = false;
        // Reagrupar con los nuevos datos
        this.groupSchedulesByDay(updatedHours);
        this.showSuccess('Todos los horarios guardados correctamente');
        setTimeout(() => this.router.navigate(['/panel-control-buisiness', this.businessId]), 1500);
      },
      error: (error) => {
        console.error('Error saving all schedules:', error);
        this.loading = false;
        this.showError('Error al guardar todos los horarios');
      }
    });
  }

  deleteAllSchedules() {
    if (!confirm('¿Resetear todos los horarios? Esto eliminará todos los horarios configurados.')) return;

    this.kitchenScheduleService.deleteAllKitchenHours(this.businessId).subscribe({
      next: () => {
        this.initializeEmptySchedules();
        this.showSuccess('Horarios reseteados. Configura los nuevos horarios y guarda los cambios.');
      },
      error: (error) => {
        console.error('Error resetting schedules:', error);
        this.showError('Error al resetear los horarios');
      }
    });
  }

  goBack() {
    this.router.navigate(['/panel-control-buisiness', this.businessId]);
  }

  getDayName(day: string): string {
    const names: { [key: string]: string } = {
      monday: 'Lunes', 
      tuesday: 'Martes', 
      wednesday: 'Miércoles',
      thursday: 'Jueves', 
      friday: 'Viernes', 
      saturday: 'Sábado', 
      sunday: 'Domingo'
    };
    return names[day] || day;
  }

  isSaving(schedule: KitchenHour): boolean {
    return this.savingDay === schedule.day;
  }

  showError(message: string) {
    this.errorMessage = message;
    this.successMessage = null;
    setTimeout(() => this.errorMessage = null, 5000);
  }

  showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = null;
    setTimeout(() => this.successMessage = null, 3000);
  }

  private stripSeconds(time: string): string {
    if (!time) return '00:00';
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
}