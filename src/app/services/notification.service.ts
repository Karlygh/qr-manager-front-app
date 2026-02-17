import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notifications$ = new BehaviorSubject<Notification[]>([]);

  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  success(message: string, duration = 5000): void {
    this.addNotification({ message, type: 'success' }, duration);
  }

  error(message: string, duration = 7000): void {
    this.addNotification({ message, type: 'error' }, duration);
  }

  warning(message: string, duration = 6000): void {
    this.addNotification({ message, type: 'warning' }, duration);
  }

  info(message: string, duration = 5000): void {
    this.addNotification({ message, type: 'info' }, duration);
  }

  private addNotification(
    { message, type }: Omit<Notification, 'id'>,
    duration: number
  ): void {
    const notification: Notification = {
      id: this.generateId(),
      message,
      type,
      duration
    };

    const current = this.notifications$.value;
    this.notifications$.next([...current, notification]);

    if (duration > 0) {
      setTimeout(() => this.removeNotification(notification.id), duration);
    }
  }

  removeNotification(id: string): void {
    const current = this.notifications$.value;
    this.notifications$.next(current.filter(n => n.id !== id));
  }

  clearAll(): void {
    this.notifications$.next([]);
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random()}`;
  }
}
