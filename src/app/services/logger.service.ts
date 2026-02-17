import { Injectable, isDevMode } from '@angular/core';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  private isDevelopment = isDevMode();

  debug(category: string, message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(`[${category}]`, message, data);
    }
  }

  info(category: string, message: string, data?: any): void {
    if (this.isDevelopment) {
      console.info(`[${category}]`, message, data);
    }
  }

  warn(category: string, message: string, data?: any): void {
    console.warn(`[${category}]`, message, data);
  }

  error(category: string, message: string, data?: any): void {
    console.error(`[${category}]`, message, data);
  }

  private getLogLevel(): LogLevel {
    return 'debug';
  }
}
