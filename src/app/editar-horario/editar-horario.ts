import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KitchenScheduleService, KitchenHour } from '../services/kitchen-schedule.service';

@Component({
  selector: 'app-editar-horario',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './editar-horario.html',
  styleUrl: './editar-horario.css'
})
export class EditarHorario implements OnInit {
  @Input() businessId: number = 1;

  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  kitchenHours: KitchenHour[] = [];
  loading = false;

  constructor(private kitchenScheduleService: KitchenScheduleService) {}

  ngOnInit() {
    this.initializeSchedule();
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
    
    const normalizedHours = this.kitchenHours.map(hour => ({
      ...hour,
      openingTime: hour.openingTime.length === 5 ? hour.openingTime + ':00' : hour.openingTime,
      closingTime: hour.closingTime.length === 5 ? hour.closingTime + ':00' : hour.closingTime
    }));
    
    this.kitchenScheduleService.saveAllKitchenHours(this.businessId, normalizedHours)
      .subscribe({
        next: (response) => {
          this.kitchenHours = response;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error details:', error);
          this.loading = false;
        }
      });
  }

  onTimeChange(index: number) {
    const schedule = this.kitchenHours[index];
    if (schedule.id) {
      this.kitchenScheduleService.updateKitchenHour(schedule.id, schedule)
        .subscribe({
          next: (response) => {
            this.kitchenHours[index] = response;
          }
        });
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