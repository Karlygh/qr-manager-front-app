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
  savingScheduleId: number | null = null;
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
            this.groupSchedulesByDay(hours);
          } else {
            this.initializeSchedule();
          }
        },
        error: () => {
          this.initializeSchedule();
        }
      });
  }

  initializeSchedule() {
    this.days.forEach(day => {
      this.daySchedules[day] = [{
        businessId: this.businessId,
        day,
        openingTime: '08:00:00',
        closingTime: '22:00:00',
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
          openingTime: '08:00:00',
          closingTime: '22:00:00',
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
      openingTime: '08:00:00',
      closingTime: '22:00:00',
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

  saveSchedule(schedule: OpeningHour) {
    const validationError = this.validateSchedule(schedule);
    if (validationError) {
      this.showError(validationError);
      return;
    }

    this.savingScheduleId = schedule.id || null;
    this.errorMessage = null;

    const normalized = {
      businessId: this.businessId,
      day: schedule.day,
      openingTime: this.normalizeTime(schedule.openingTime),
      closingTime: this.normalizeTime(schedule.closingTime),
      status: schedule.status !== undefined ? schedule.status : true
    };

    if (schedule.id) {
      this.openingScheduleService.updateOpeningHour(schedule.id, normalized).subscribe({
        next: (updated) => {
          Object.assign(schedule, updated);
          // Actualizar en la lista principal
          const index = this.openingHours.findIndex(h => h.id === schedule.id);
          if (index !== -1) {
            this.openingHours[index] = {...updated};
          }
          this.savingScheduleId = null;
          this.showSuccess('Horario guardado correctamente');
        },
        error: (err) => {
          console.error('Error updating schedule:', err);
          this.showError('Error al guardar el horario');
          this.savingScheduleId = null;
        }
      });
    } else {
      this.openingScheduleService.createOpeningHour(this.businessId, normalized).subscribe({
        next: (created) => {
          Object.assign(schedule, created);
          // Actualizar la lista principal de horarios
          this.openingHours.push(created);
          this.savingScheduleId = null;
          this.showSuccess('Horario creado correctamente');
        },
        error: (err) => {
          console.error('Error creating schedule:', err);
          this.showError('Error al crear el horario');
          this.savingScheduleId = null;
        }
      });
    }
  }

  deleteSchedule(day: string, schedule: OpeningHour) {
    if (!schedule.id) {
      const index = this.daySchedules[day].indexOf(schedule);
      if (index > -1) {
        this.daySchedules[day].splice(index, 1);
      }
      
      if (this.daySchedules[day].length === 0) {
        this.daySchedules[day] = [{
          businessId: this.businessId,
          day,
          openingTime: '08:00:00',
          closingTime: '22:00:00',
          status: true
        }];
      }
      return;
    }

    if (!confirm('¿Estás seguro de eliminar este horario?')) {
      return;
    }

    this.openingScheduleService.deleteOpeningHour(schedule.id).subscribe({
      next: () => {
        const index = this.daySchedules[day].indexOf(schedule);
        if (index > -1) {
          this.daySchedules[day].splice(index, 1);
        }
        
        // Eliminar de la lista principal
        const mainIndex = this.openingHours.findIndex(h => h.id === schedule.id);
        if (mainIndex !== -1) {
          this.openingHours.splice(mainIndex, 1);
        }
        
        if (this.daySchedules[day].length === 0) {
          this.daySchedules[day] = [{
            businessId: this.businessId,
            day,
            openingTime: '08:00:00',
            closingTime: '22:00:00',
            status: true
          }];
        }
        
        this.showSuccess('Horario eliminado correctamente');
      },
      error: (err) => {
        console.error('Error deleting schedule:', err);
        this.showError('Error al eliminar el horario');
      }
    });
  }

  saveAllSchedules() {
    this.loading = true;
    this.errorMessage = null;

    const allSchedules: OpeningHour[] = [];
    for (const day of this.days) {
      allSchedules.push(...this.daySchedules[day]);
    }

    for (const schedule of allSchedules) {
      const validationError = this.validateSchedule(schedule);
      if (validationError) {
        this.showError(`Error en ${this.getDayName(schedule.day)}: ${validationError}`);
        this.loading = false;
        return;
      }
    }

    const updatePromises = allSchedules
      .filter(s => s.id)
      .map(schedule => {
        const normalized = {
          businessId: this.businessId,
          day: schedule.day,
          openingTime: this.normalizeTime(schedule.openingTime),
          closingTime: this.normalizeTime(schedule.closingTime),
          status: schedule.status !== undefined ? schedule.status : true
        };
        return this.openingScheduleService.updateOpeningHour(schedule.id!, normalized).toPromise();
      });

    const createPromises = allSchedules
      .filter(s => !s.id)
      .map(schedule => {
        const normalized = {
          businessId: this.businessId,
          day: schedule.day,
          openingTime: this.normalizeTime(schedule.openingTime),
          closingTime: this.normalizeTime(schedule.closingTime),
          status: schedule.status !== undefined ? schedule.status : true
        };
        return this.openingScheduleService.createOpeningHour(this.businessId, normalized).toPromise();
      });

    Promise.all([...updatePromises, ...createPromises])
      .then((results) => {
        // Actualizar openingHours con los resultados
        this.loadSchedule();
        this.loading = false;
        this.showSuccess('Todos los horarios guardados correctamente');
        setTimeout(() => {
          this.router.navigate(['/panel-control-buisiness', this.businessId]);
        }, 1500);
      })
      .catch((error) => {
        console.error('Error saving schedules:', error);
        this.showError('Error al guardar los horarios');
        this.loading = false;
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
          this.showSuccess('Horarios reseteados correctamente');
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.showError('Error al resetear los horarios');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/panel-control-buisiness', this.businessId]);
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
    return this.savingScheduleId === schedule.id;
  }

  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = null;
    }, 5000);
  }

  showSuccess(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }
}