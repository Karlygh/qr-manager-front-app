import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  inject,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ScheduleHour, ScheduleService } from '../../models/schedule.model';
import { DayOfWeek } from '../../types/day-of-week.type';

interface ScheduleState<T extends ScheduleHour> {
  current: T;           // Estado actual del schedule
  original: T;          // Estado original del servidor
  isModified: boolean;  // ¿Ha cambiado?
  isSaving: boolean;    // ¿Se está guardando?
  error: string | null; // Errores de validación
}

@Component({
  selector: 'app-schedule-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-editor.component.html',
  styleUrls: ['./schedule-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush // ✓ MEJOR PERFORMANCE
})
export class ScheduleEditorComponent<T extends ScheduleHour> implements OnInit, OnChanges, OnDestroy {
  @Input() businessId!: number;
  @Input() schedules: T[] = [];
  @Input() service!: ScheduleService<T>;
  @Input() title: string = 'Horarios';
  @Input() instructionText: string = 'Configura los horarios';
  @Input() backRoute: string = '/panel-control-business';

  @Output() schedulesChange = new EventEmitter<T[]>();

  private router = inject(Router);
  private destroy$ = new Subject<void>(); // ✓ NUEVO: Para limpiar subscripciones

  days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // ✓ MEJORADO: Tracking de estado por schedule
  scheduleStates = signal<Map<string, ScheduleState<T>>>(new Map());
  daySchedules = signal<Record<DayOfWeek, T[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // ✓ NUEVO: Modal de confirmación
  showDeleteModal = signal(false);
  deleteModalData = signal<{ day: DayOfWeek; schedule: T } | null>(null);

  // ✓ NUEVO: Detectar si hay cambios sin guardar
  hasAnyChanges = computed(() => {
    const states = this.scheduleStates();
    return Array.from(states.values()).some(state => state.isModified);
  });

  // ✓ NUEVO: Contar cuántos cambios hay sin guardar
  changesCount = computed(() => {
    const states = this.scheduleStates();
    return Array.from(states.values()).filter(state => state.isModified).length;
  });

  ngOnInit() {
    if (this.schedules.length === 0) {
      this.initializeEmptySchedules();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['schedules'] && changes['schedules'].currentValue?.length > 0) {
      this.groupSchedulesByDay(changes['schedules'].currentValue);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✓ MEJORADO: Agrupar y crear estados para cada schedule
  groupSchedulesByDay(hours: T[]) {
    const grouped: Record<DayOfWeek, T[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    const states = new Map<string, ScheduleState<T>>();

    hours.forEach(hour => {
      if (!grouped[hour.day]) grouped[hour.day] = [];

      const schedule = {
        ...hour,
        tempId: hour.tempId || this.generateId()
      } as T;

      grouped[hour.day].push(schedule);

      // ✓ NUEVO: Crear estado para este schedule
      const scheduleId = this.getScheduleId(schedule);
      states.set(scheduleId, {
        current: JSON.parse(JSON.stringify(schedule)), // Deep copy
        original: JSON.parse(JSON.stringify(schedule)),
        isModified: false,
        isSaving: false,
        error: null
      });
    });

    // Días vacíos obtienen un schedule por defecto
    this.days.forEach(day => {
      if (grouped[day].length === 0) {
        const defaultSchedule = this.createDefaultSchedule(day);
        grouped[day] = [defaultSchedule];

        const scheduleId = this.getScheduleId(defaultSchedule);
        states.set(scheduleId, {
          current: JSON.parse(JSON.stringify(defaultSchedule)),
          original: JSON.parse(JSON.stringify(defaultSchedule)),
          isModified: false,
          isSaving: false,
          error: null
        });
      }
    });

    this.daySchedules.set(grouped);
    this.scheduleStates.set(states);
  }

  initializeEmptySchedules() {
    const schedules: Record<DayOfWeek, T[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    const states = new Map<string, ScheduleState<T>>();

    this.days.forEach(day => {
      const defaultSchedule = this.createDefaultSchedule(day);
      schedules[day] = [defaultSchedule];

      const scheduleId = this.getScheduleId(defaultSchedule);
      states.set(scheduleId, {
        current: JSON.parse(JSON.stringify(defaultSchedule)),
        original: JSON.parse(JSON.stringify(defaultSchedule)),
        isModified: false,
        isSaving: false,
        error: null
      });
    });

    this.daySchedules.set(schedules);
    this.scheduleStates.set(states);
  }

  createDefaultSchedule(day: DayOfWeek): T {
    return {
      businessId: this.businessId,
      day,
      openingTime: '09:00',
      closingTime: '22:00',
      status: true,
      tempId: this.generateId()
    } as T;
  }

  // ✓ NUEVO: Detectar cambios en tiempo real con inmutabilidad estricta
  onScheduleChange(schedule: T, field: keyof T, value: any) {
    const scheduleId = this.getScheduleId(schedule);
    
    // 1. Actualizamos primero los datos brutos del horario
    this.daySchedules.update(prev => {
      const day = schedule.day;
      const updatedDayArray = prev[day].map(s => 
        this.getScheduleId(s) === scheduleId ? { ...s, [field]: value } : s
      );
      return { ...prev, [day]: updatedDayArray };
    });

    // 2. Ahora actualizamos el estado visual (isModified, error, etc.)
    this.scheduleStates.update(currentStates => {
      const newStates = new Map(currentStates);
      const state = newStates.get(scheduleId);
      
      if (state) {
        // Obtenemos el schedule actualizado
        const updatedSchedule = this.daySchedules()[schedule.day].find(s => this.getScheduleId(s) === scheduleId)!;
        
        const isModified = !this.areSchedulesEqual(updatedSchedule, state.original);
        
        // Validar con los datos actualizados
        const error = this.validateSchedule(updatedSchedule);

        newStates.set(scheduleId, {
          ...state,
          current: updatedSchedule,
          isModified,
          error
        });

        // Re-validar otros horarios del mismo día para limpiar errores cruzados
        this.revalidateDaySchedules(schedule.day, newStates);
      }
      
      return newStates;
    });
  }

  // ✓ MEJORADO: Validación más robusta
  validateSchedule(schedule: T): string | null {
    // Validar formato de hora
    if (!this.isValidTimeFormat(schedule.openingTime)) {
      return 'Formato de apertura inválido (ej: 09:00)';
    }
    if (!this.isValidTimeFormat(schedule.closingTime)) {
      return 'Formato de cierre inválido (ej: 22:00)';
    }

    const opening = this.timeToMinutes(schedule.openingTime);
    const closing = this.timeToMinutes(schedule.closingTime);

    // Validar rango válido
    if (opening < 0 || opening > 1439) {
      return 'Hora de apertura fuera de rango';
    }
    if (closing < 0 || closing > 1439) {
      return 'Hora de cierre fuera de rango';
    }

    // Validar que cierre sea después de apertura
    if (closing <= opening) {
      return 'La hora de cierre debe ser posterior a la de apertura';
    }

    // Validar solapamientos con otros horarios del mismo día
    const daySchedules = this.daySchedules()[schedule.day] || [];
    for (const other of daySchedules) {
      if (
        other.tempId === schedule.tempId ||
        other.id === schedule.id
      ) {
        continue; // Skip self
      }

      const otherOpening = this.timeToMinutes(other.openingTime);
      const otherClosing = this.timeToMinutes(other.closingTime);

      // Detectar solapamiento
      if (opening < otherClosing && closing > otherOpening) {
        return `Solapamiento con otro horario (${other.openingTime}-${other.closingTime})`;
      }
    }

    return null;
  }

  // ✓ NUEVO: Validar formato de hora
  private isValidTimeFormat(time: string): boolean {
    const pattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return pattern.test(time);
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // ✓ NUEVO: Comparar si dos schedules son iguales
  private areSchedulesEqual(a: T, b: T): boolean {
    return (
      a.openingTime === b.openingTime &&
      a.closingTime === b.closingTime &&
      a.status === b.status &&
      a.day === b.day
    );
  }

  // ✓ NUEVO: Re-validar todos los horarios del mismo día para limpiar errores cruzados
  private revalidateDaySchedules(day: DayOfWeek, statesMap: Map<string, ScheduleState<T>>) {
    const dayHours = this.daySchedules()[day];
    
    dayHours.forEach(h => {
      const id = this.getScheduleId(h);
      const state = statesMap.get(id);
      if (state) {
        const error = this.validateSchedule(h);
        statesMap.set(id, {
          ...state,
          error
        });
      }
    });
  }

  // ✓ MEJORADO: Guardar solo el schedule modificado
  saveSchedule(schedule: T) {
    const scheduleId = this.getScheduleId(schedule);
    const states = this.scheduleStates();
    const state = states.get(scheduleId);

    if (!state || !state.isModified) {
      this.showError('No hay cambios para guardar');
      return;
    }

    // Validar antes de guardar
    const error = this.validateSchedule(state.current);
    if (error) {
      state.error = error;
      this.showError(error);
      return;
    }

    state.isSaving = true;
    this.scheduleStates.set(new Map(states));

    const day = schedule.day;
    const daySchedules = this.daySchedules()[day];

    // Guardar SOLO este día (que puede tener múltiples horarios)
    this.service.saveDaySchedules(this.businessId, day, daySchedules)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          state.isSaving = false;
          this.scheduleStates.set(new Map(states));
        })
      )
      .subscribe({
        next: (response) => {
          const updatedSchedules = this.mapResponseToSchedules(response);

          // Actualizar daySchedules
          this.daySchedules.update(prev => ({
            ...prev,
            [day]: updatedSchedules
          }));

          // Actualizar estados: marcar como no modificado
          updatedSchedules.forEach(updated => {
            const updatedId = this.getScheduleId(updated);
            const updatedState = states.get(updatedId);
            if (updatedState) {
              updatedState.original = JSON.parse(JSON.stringify(updated));
              updatedState.current = JSON.parse(JSON.stringify(updated));
              updatedState.isModified = false;
              updatedState.error = null;
            }
          });

          this.scheduleStates.set(new Map(states));
          this.showSuccess(`✓ Horarios de ${this.getDayName(day)} guardados`);
          this.emitSchedulesChange();
        },
        error: (error) => {
          console.error('Error saving schedules:', error);
          const errorMsg = error.error?.message || 'Error al guardar los horarios';
          state.error = errorMsg;
          this.showError(errorMsg);
        }
      });
  }

  addSplitSchedule(day: DayOfWeek) {
    const daySchedulesArray = this.daySchedules()[day];

    if (daySchedulesArray.length >= 2) {
      this.showError('Máximo 2 horarios por día');
      return;
    }

    const newSchedule = this.createDefaultSchedule(day);

    this.daySchedules.update(prev => ({
      ...prev,
      [day]: [...prev[day], newSchedule]
    }));

    // Crear estado para el nuevo schedule
    const scheduleId = this.getScheduleId(newSchedule);
    const states = this.scheduleStates();
    states.set(scheduleId, {
      current: JSON.parse(JSON.stringify(newSchedule)),
      original: JSON.parse(JSON.stringify(newSchedule)),
      isModified: true, // Nuevo schedule siempre está "modificado"
      isSaving: false,
      error: null
    });

    this.scheduleStates.set(new Map(states));
  }

  canAddSchedule(day: DayOfWeek): boolean {
    return (this.daySchedules()[day]?.length || 0) < 2;
  }

  deleteSchedule(day: DayOfWeek, schedule: T) {
    const daySchedulesArray = this.daySchedules()[day];

    if (daySchedulesArray.length === 1) {
      this.showError('Debe haber al menos un horario por día');
      return;
    }

    // Mostrar modal de confirmación
    this.deleteModalData.set({ day, schedule });
    this.showDeleteModal.set(true);
  }

  // ✓ NUEVO: Confirmar eliminación desde el modal
  confirmDelete() {
    const data = this.deleteModalData();
    if (!data) return;

    const { day, schedule } = data;
    const daySchedulesArray = this.daySchedules()[day];
    const scheduleId = this.getScheduleId(schedule);

    // Cerrar modal
    this.showDeleteModal.set(false);
    this.deleteModalData.set(null);

    // Remover del estado
    this.scheduleStates.update(currentStates => {
      const newStates = new Map(currentStates);
      newStates.delete(scheduleId);
      return newStates;
    });

    // Remover del array
    this.daySchedules.update(prev => ({
      ...prev,
      [day]: prev[day].filter(s => this.getScheduleId(s) !== scheduleId)
    }));

    // Guardar cambios en el backend inmediatamente
    const updatedDaySchedules = this.daySchedules()[day];
    this.loading.set(true);

    this.service.saveDaySchedules(this.businessId, day, updatedDaySchedules)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response) => {
          const updatedSchedules = this.mapResponseToSchedules(response);

          this.daySchedules.update(prev => ({
            ...prev,
            [day]: updatedSchedules
          }));

          this.scheduleStates.update(currentStates => {
            const newStates = new Map(currentStates);
            
            daySchedulesArray.forEach(s => {
              newStates.delete(this.getScheduleId(s));
            });

            updatedSchedules.forEach(updated => {
              const updatedId = this.getScheduleId(updated);
              newStates.set(updatedId, {
                current: JSON.parse(JSON.stringify(updated)),
                original: JSON.parse(JSON.stringify(updated)),
                isModified: false,
                isSaving: false,
                error: null
              });
            });

            return newStates;
          });

          this.showSuccess(`✓ Horario eliminado correctamente`);
          this.emitSchedulesChange();
        },
        error: (error) => {
          console.error('Error deleting schedule:', error);
          this.showError('Error al eliminar el horario');
          
          this.daySchedules.update(prev => ({
            ...prev,
            [day]: daySchedulesArray
          }));
          
          this.scheduleStates.update(currentStates => {
            const newStates = new Map(currentStates);
            newStates.set(scheduleId, {
              current: JSON.parse(JSON.stringify(schedule)),
              original: JSON.parse(JSON.stringify(schedule)),
              isModified: false,
              isSaving: false,
              error: null
            });
            return newStates;
          });
        }
      });
  }

  // ✓ NUEVO: Cancelar eliminación
  cancelDelete() {
    this.showDeleteModal.set(false);
    this.deleteModalData.set(null);
  }

  saveAllSchedules() {
    // Validar todos
    const states = this.scheduleStates();
    for (const state of states.values()) {
      const error = this.validateSchedule(state.current);
      if (error) {
        this.showError(`Error: ${error}`);
        return;
      }
    }

    this.loading.set(true);
    const allSchedules = Object.values(this.daySchedules()).flat();

    if (this.service.saveAllSchedules) {
      this.service.saveAllSchedules(this.businessId, allSchedules)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: () => {
            this.showSuccess('✓ Todos los horarios guardados correctamente');
            setTimeout(() => this.goBack(), 1500);
            this.emitSchedulesChange();
          },
          error: (error) => {
            console.error('Error saving all schedules:', error);
            this.showError('Error al guardar todos los horarios');
          }
        });
    }
  }

  deleteAllSchedules() {
    if (
      !confirm(
        '¿Resetear todos los horarios? Esto eliminará todos los horarios configurados.'
      )
    ) {
      return;
    }

    if (this.service.deleteAllSchedules) {
      this.service.deleteAllSchedules(this.businessId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: () => {
            this.initializeEmptySchedules();
            this.showSuccess(
              'Horarios reseteados. Configura los nuevos horarios y guarda los cambios.'
            );
          },
          error: (error) => {
            console.error('Error resetting schedules:', error);
            this.showError('Error al resetear los horarios');
          }
        });
    }
  }

  goBack() {
    if (this.hasAnyChanges()) {
      if (!confirm('Tienes cambios sin guardar. ¿Seguro que quieres salir?')) {
        return;
      }
    }
    this.router.navigate([this.backRoute, this.businessId], {
      state: { refresh: true }
    });
  }

  getDayName(day: DayOfWeek): string {
    const names: Record<DayOfWeek, string> = {
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

  isSaving(schedule: T): boolean {
    const scheduleId = this.getScheduleId(schedule);
    const state = this.scheduleStates().get(scheduleId);
    return state?.isSaving || false;
  }

  isModified(schedule: T): boolean {
    const scheduleId = this.getScheduleId(schedule);
    const state = this.scheduleStates().get(scheduleId);
    return state?.isModified || false;
  }

  hasError(schedule: T): boolean {
    const scheduleId = this.getScheduleId(schedule);
    const state = this.scheduleStates().get(scheduleId);
    return !!state?.error;
  }

  getError(schedule: T): string | null {
    const scheduleId = this.getScheduleId(schedule);
    const state = this.scheduleStates().get(scheduleId);
    return state?.error || null;
  }

  // ✓ HELPER: Generar ID único para un schedule
  private getScheduleId(schedule: T): string {
    return schedule.tempId || schedule.id?.toString() || this.generateId();
  }

  private generateId(): string {
    return `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapResponseToSchedules(response: any): T[] {
    return response.intervals.map((interval: any) => ({
      id: interval.id,
      businessId: response.businessId,
      day: response.day,
      openingTime: this.stripSeconds(interval.startTime),
      closingTime: this.stripSeconds(interval.endTime),
      status: response.status,
      dayGroupId: response.id,
      tempId: this.generateId()
    } as T));
  }

  private stripSeconds(time: string): string {
    if (!time) return '00:00';
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set(null);
    setTimeout(() => this.errorMessage.set(null), 5000);
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set(null);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  private emitSchedulesChange() {
    const allSchedules = Object.values(this.daySchedules()).flat();
    this.schedulesChange.emit(allSchedules);
  }
}