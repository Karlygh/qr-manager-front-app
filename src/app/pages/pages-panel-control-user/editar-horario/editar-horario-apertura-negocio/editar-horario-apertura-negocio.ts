import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OpeningScheduleService, OpeningHour } from '../../../../services/opening-schedule.service';

interface DaySchedules {
  [key: string]: OpeningHour[];
}

@Component({
  selector: 'app-editar-horario-apertura-negocio',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './editar-horario-apertura-negocio.html',
  styleUrls: ['./editar-horario-apertura-negocio.css']
})
export class EditarHorarioAperturaNegocio implements OnInit {
  @Input() businessId: number = 1;
  @Input() openingHours: OpeningHour[] = [];

  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  daySchedules: DaySchedules = {};
  loading = false;
  savingDay: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private openingScheduleService: OpeningScheduleService, private router: Router) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || (typeof window !== 'undefined' ? window.history.state : {});
    
    if (state?.openingHours && state.openingHours.length > 0) {
      this.openingHours = state.openingHours;
      this.businessId = state.businessId || this.businessId;
      this.groupSchedulesByDay(this.openingHours);
    } else if (this.openingHours.length > 0) {
      this.groupSchedulesByDay(this.openingHours);
    } else {
      const storedBusinessId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentBusinessId') : null;
      if (storedBusinessId) {
        this.businessId = Number(storedBusinessId);
      }
      this.loadSchedule();
    }
  }

  loadSchedule() {
    this.openingScheduleService.getOpeningHoursByBusiness(this.businessId)
      .subscribe({
        next: (hours) => {
          if (hours && hours.length > 0) {
            this.openingHours = hours;
            this.groupSchedulesByDay(hours);
          } else {
            this.initializeSchedule();
          }
        },
        error: (err) => {
          console.error('Error loading schedules:', err);
          this.initializeSchedule();
        }
      });
  }

  initializeSchedule() {
    this.days.forEach(day => {
      this.daySchedules[day] = [{
        businessId: this.businessId,
        day,
        openingTime: '08:00',
        closingTime: '22:00',
        status: true
      }];
    });
  }

  groupSchedulesByDay(hours: OpeningHour[]) {
    this.daySchedules = {};
    this.days.forEach(day => {
      this.daySchedules[day] = [];
    });

    hours.forEach(hour => {
      if (!this.daySchedules[hour.day]) {
        this.daySchedules[hour.day] = [];
      }
      this.daySchedules[hour.day].push({...hour});
    });

    this.days.forEach(day => {
      if (this.daySchedules[day].length === 0) {
        this.daySchedules[day] = [{
          businessId: this.businessId,
          day,
          openingTime: '08:00',
          closingTime: '22:00',
          status: true
        }];
      }
    });
  }

  addSplitSchedule(day: string) {
    if (this.daySchedules[day].length >= 2) {
      this.showError('Máximo 2 horarios permitidos por día');
      return;
    }

    this.daySchedules[day].push({
      businessId: this.businessId,
      day,
      openingTime: '08:00',
      closingTime: '22:00',
      status: true
    });
  }

  canAddSchedule(day: string): boolean {
    return this.daySchedules[day] && this.daySchedules[day].length < 2;
  }

  validateSchedule(schedule: OpeningHour): string | null {
    const opening = this.timeToMinutes(schedule.openingTime);
    const closing = this.timeToMinutes(schedule.closingTime);

    if (closing <= opening) {
      return 'La hora de cierre debe ser posterior a la de apertura';
    }

    const daySchedules = this.daySchedules[schedule.day].filter(s => 
      s !== schedule && s.id !== schedule.id
    );

    for (const otherSchedule of daySchedules) {
      const otherOpening = this.timeToMinutes(otherSchedule.openingTime);
      const otherClosing = this.timeToMinutes(otherSchedule.closingTime);

      if (
        (opening >= otherOpening && opening < otherClosing) ||
        (closing > otherOpening && closing <= otherClosing) ||
        (opening <= otherOpening && closing >= otherClosing)
      ) {
        return 'Los horarios no pueden solaparse';
      }
    }

    return null;
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  normalizeTime(time: string): string {
    return time.length === 5 ? time + ':00' : time;
  }

  // Guardar un horario individual = guardar TODOS los horarios del día
  saveSchedule(schedule: OpeningHour) {
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
    this.errorMessage = null;

    // Guardar todos los horarios del día
    this.openingScheduleService.saveDaySchedules(this.businessId, day, daySchedules).subscribe({
      next: (response) => {
        // Actualizar los horarios con la respuesta del servidor
        const newHours: OpeningHour[] = [];
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
        
        // Actualizar la lista principal de openingHours
        this.openingHours = this.openingHours.filter(h => h.day !== day);
        this.openingHours.push(...newHours);
        
        this.savingDay = null;
        this.showSuccess('Horarios del día guardados correctamente');
      },
      error: (err) => {
        console.error('Error saving day schedules:', err);
        this.showError('Error al guardar el horario');
        this.savingDay = null;
      }
    });
  }

  deleteSchedule(day: string, schedule: OpeningHour) {
    // Si es el único horario del día, no permitir eliminar
    if (this.daySchedules[day].length === 1) {
      this.showError('Debe haber al menos un horario por día');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar este horario?')) {
      return;
    }

    // Remover del array local
    const index = this.daySchedules[day].indexOf(schedule);
    if (index > -1) {
      this.daySchedules[day].splice(index, 1);
    }
    
    // Eliminar de la lista principal
    const mainIndex = this.openingHours.findIndex(h => h.id === schedule.id);
    if (mainIndex !== -1) {
      this.openingHours.splice(mainIndex, 1);
    }
    
    this.showSuccess('Horario eliminado. Recuerda guardar los cambios.');
  }

  saveAllSchedules() {
    this.loading = true;
    this.errorMessage = null;

    const allSchedules: OpeningHour[] = [];
    for (const day of this.days) {
      allSchedules.push(...this.daySchedules[day]);
    }

    // Validar todos los horarios
    for (const schedule of allSchedules) {
      const validationError = this.validateSchedule(schedule);
      if (validationError) {
        this.showError(`Error en ${this.getDayName(schedule.day)}: ${validationError}`);
        this.loading = false;
        return;
      }
    }

    this.openingScheduleService.saveAllOpeningHours(this.businessId, allSchedules).subscribe({
      next: (updatedHours) => {
        this.loading = false;
        this.openingHours = updatedHours;
        this.groupSchedulesByDay(updatedHours);
        this.showSuccess('Todos los horarios guardados correctamente');
        setTimeout(() => {
          this.router.navigate(['/panel-control-business', this.businessId]);
        }, 1500);
      },
      error: (error) => {
        console.error('Error saving all schedules:', error);
        this.showError('Error al guardar los horarios');
        this.loading = false;
      }
    });
  }

  deleteAllSchedules() {
    if (!confirm('¿Estás seguro de resetear todos los horarios?')) {
      return;
    }

    this.openingScheduleService.deleteAllOpeningHours(this.businessId)
      .subscribe({
        next: () => {
          this.initializeSchedule();
          this.openingHours = [];
          this.showSuccess('Horarios reseteados correctamente');
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.showError('Error al resetear los horarios');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/panel-control-business', this.businessId]);
  }

  getDayName(day: string): string {
    const dayNames: { [key: string]: string } = {
      'monday': 'Lunes',
      'tuesday': 'Martes',
      'wednesday': 'Miércoles',
      'thursday': 'Jueves',
      'friday': 'Viernes',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    };
    return dayNames[day] || day;
  }

  isSaving(schedule: OpeningHour): boolean {
    return this.savingDay === schedule.day;
  }

  showError(message: string) {
    this.errorMessage = message;
    this.successMessage = null;
    setTimeout(() => {
      this.errorMessage = null;
    }, 5000);
  }

  showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = null;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  private stripSeconds(time: string): string {
    if (!time) return '00:00';
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
}