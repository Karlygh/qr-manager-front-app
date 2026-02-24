import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginResponse, RegisterResponse, RefreshTokenResponse } from '../../shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  
  private apiUrl = 'http://91.107.235.58:8081/api/v1/auth-manager/auth';
  private accessTokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  
  // Login
  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.accessToken) {
          this.setTokens(response.accessToken, response.refreshToken);
        }
      })
    );
  }

  // Registro
  register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    secondLastName: string;
    postalCode: string;
    address: string;
    city: string;
    country: string;
    locality: string;
    phone: string;
  }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, userData);
  }

  // Refresh Token
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => {
        if (response.accessToken) {
          this.setTokens(response.accessToken, response.refreshToken);
        }
      })
    );
  }
  
  // Logout
  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post(`${this.apiUrl}/logout`, { refreshToken }).pipe(
      tap(() => {
        this.clearTokens();
      })
    );
  }

  // Logout local (sin llamada al backend)
  logoutLocal(): void {
    this.clearTokens();
  }
  
  // Guardar tokens
  private setTokens(accessToken: string, refreshToken: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.accessTokenKey, accessToken);
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    }
    this.isAuthenticatedSubject.next(true);
  }

  // Limpiar tokens
  private clearTokens(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.accessTokenKey);
      localStorage.removeItem(this.refreshTokenKey);
    }
    this.isAuthenticatedSubject.next(false);
  }
  
  // Obtener access token
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.accessTokenKey);
    }
    return null;
  }

  // Obtener refresh token
  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.refreshTokenKey);
    }
    return null;
  }
  
  // Observable de autenticación
  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  // Verificar si está autenticado (síncrono)
  isAuthenticatedSync(): boolean {
    return this.hasToken();
  }
  
  // Verificar si hay token
  private hasToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem(this.accessTokenKey);
    }
    return false;
  }
}