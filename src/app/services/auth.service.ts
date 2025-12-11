import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://91.107.235.58:8081/api/v1/business';
  private tokenKey = 'auth_token';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  
  constructor(private http: HttpClient) {}
  
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

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
    phone?: string;
  }): Observable<any> {
    return this.http.post('http://localhost:8080/api/v1/auth-manager/auth/register', userData);
  }
  
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isAuthenticatedSubject.next(false);
  }
  
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.isAuthenticatedSubject.next(true);
  }
  
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  
  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }
  
  private hasToken(): boolean {
    return !!this.getToken();
  }
}
