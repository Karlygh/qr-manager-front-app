import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OpeningScheduleService, OpeningHour } from '../../services/opening-schedule.service';

@Component({
  selector: 'app-editar-campos-horario-apertura',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './editar-campos-horario-apertura.html',
  styleUrls: ['./editar-campos-horario-apertura.css']
})
export class EditarCamposHorarioApertura implements OnInit {
  businessId: number = 1;
  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  openingHours: OpeningHour[] = [];
  loading = false;

  constructor(private openingScheduleService: OpeningScheduleService, private router: Router) {}

  ngOnInit() {
    this.businessId = Number(localStorage.getItem('currentBusinessId')) || 1;
    this.loadSchedule();
  }

  loadSchedule() {
    this.openingScheduleService.getOpeningHoursByBusiness(this.businessId)
      .subscribe({
        next: (hours) => {
          if (hours && hours.length > 0) {
            this.openingHours = hours;
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
    this.openingHours = this.days.map(day => ({
      businessId: this.businessId,
      day,
      openingTime: '08:00:00',
      closingTime: '22:00:00',
      status: true
    }));
  }

  saveAllSchedules() {
    this.loading = true;
    const hasExistingSchedules = this.openingHours.some(hour => hour.id);
    
    if (hasExistingSchedules) {
      const updatePromises = this.openingHours.map(hour => {
        const normalized = {
          businessId: this.businessId,
          day: hour.day,
          openingTime: hour.openingTime.length === 5 ? hour.openingTime + ':00' : hour.openingTime,
          closingTime: hour.closingTime.length === 5 ? hour.closingTime + ':00' : hour.closingTime,
          status: hour.status
        };
        return this.openingScheduleService.updateOpeningHour(hour.id!, normalized).toPromise();
      });
      
      Promise.all(updatePromises)
        .then(() => {
          this.loading = false;
          this.router.navigate(['/panel-control-buisiness', this.businessId]);
        })
        .catch((error) => {
          console.error('Error updating schedules:', error);
          this.loading = false;
        });
    } else {
      const normalizedHours = this.openingHours.map(hour => ({
        businessId: this.businessId,
        day: hour.day,
        openingTime: hour.openingTime.length === 5 ? hour.openingTime + ':00' : hour.openingTime,
        closingTime: hour.closingTime.length === 5 ? hour.closingTime + ':00' : hour.closingTime,
        status: hour.status
      }));
      
      this.openingScheduleService.saveAllOpeningHours(this.businessId, normalizedHours)
        .subscribe({
          next: (response) => {
            this.openingHours = response;
            this.loading = false;
            this.router.navigate(['/panel-control-buisiness', this.businessId]);
          },
          error: (error) => {
            console.error('Error creating schedules:', error);
            this.loading = false;
          }
        });
    }
  }

  onTimeChange(index: number) {
    const schedule = this.openingHours[index];
    if (schedule.id) {
      const normalized = {
        businessId: this.businessId,
        day: schedule.day,
        openingTime: schedule.openingTime.length === 5 ? schedule.openingTime + ':00' : schedule.openingTime,
        closingTime: schedule.closingTime.length === 5 ? schedule.closingTime + ':00' : schedule.closingTime,
        status: schedule.status
      };
      this.openingScheduleService.updateOpeningHour(schedule.id, normalized)
        .subscribe();
    }
  }

  deleteAllSchedules() {
    this.openingScheduleService.deleteAllOpeningHours(this.businessId)
      .subscribe({
        next: () => {
          this.initializeSchedule();
        },
        error: (error) => {
          console.error('Delete error:', error);
        }
      });
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
}
