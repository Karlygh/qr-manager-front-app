import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
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
  @Input() businessId: number = 1;

  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  kitchenHours: KitchenHour[] = [];
  loading = false;

  constructor(private kitchenScheduleService: KitchenScheduleService, private router: Router) {}

  ngOnInit() {
    this.loadSchedule();
  }

  loadSchedule() {
    this.kitchenScheduleService.getKitchenHoursByBusiness(this.businessId)
      .subscribe({
        next: (hours) => {
          if (hours && hours.length > 0) {
            this.kitchenHours = hours;
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
    this.kitchenHours = this.days.map(day => ({
      businessId: this.businessId,
      day,
      openingTime: '09:00:00',
      closingTime: '22:00:00'
    }));
  }

  saveAllSchedules() {
    this.loading = true;
    
    const hasExistingSchedules = this.kitchenHours.some(hour => hour.id);
    
    if (hasExistingSchedules) {
      // Actualizar horarios existentes usando PATCH
      const updatePromises = this.kitchenHours.map(hour => {
        const normalized = {
          businessId: this.businessId,
          day: hour.day,
          openingTime: hour.openingTime.length === 5 ? hour.openingTime + ':00' : hour.openingTime,
          closingTime: hour.closingTime.length === 5 ? hour.closingTime + ':00' : hour.closingTime
        };
        return this.kitchenScheduleService.updateKitchenHour(hour.id!, normalized).toPromise();
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
      // Crear nuevos horarios usando POST
      const normalizedHours = this.kitchenHours.map(hour => ({
        businessId: this.businessId,
        day: hour.day,
        openingTime: hour.openingTime.length === 5 ? hour.openingTime + ':00' : hour.openingTime,
        closingTime: hour.closingTime.length === 5 ? hour.closingTime + ':00' : hour.closingTime
      }));
      
      this.kitchenScheduleService.saveAllKitchenHours(this.businessId, normalizedHours)
        .subscribe({
          next: (response) => {
            this.kitchenHours = response;
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
    const schedule = this.kitchenHours[index];
    if (schedule.id) {
      const normalized = {
        businessId: this.businessId,
        day: schedule.day,
        openingTime: schedule.openingTime.length === 5 ? schedule.openingTime + ':00' : schedule.openingTime,
        closingTime: schedule.closingTime.length === 5 ? schedule.closingTime + ':00' : schedule.closingTime
      };
      this.kitchenScheduleService.updateKitchenHour(schedule.id, normalized)
        .subscribe();
    }
  }

  deleteAllSchedules() {
    console.log('Deleting all schedules for businessId:', this.businessId);
    
    this.kitchenScheduleService.deleteAllKitchenHours(this.businessId)
      .subscribe({
        next: () => {
          console.log('Delete successful');
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