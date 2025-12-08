import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Definición de la interfaz de la Red Social
export interface SocialNetwork {
  id?: number; // El ID es opcional al crear
  businessId: number;
  name: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocialNetworkService {
  // Asegúrate de que esta URL base sea correcta
  private apiUrl = '/api/v1/social-network'; 

  constructor(private http: HttpClient) { }

  /**
   * GET /api/v1/social-network/{businessId}
   * Obtiene la lista de redes sociales de un negocio.
   */
  getSocialNetworksByBusinessId(businessId: number): Observable<SocialNetwork[]> {
    return this.http.get<SocialNetwork[]>(`${this.apiUrl}/${businessId}`);
  }

  /**
   * POST /api/v1/social-network
   * Crea una red social individual.
   */
  createSocialNetwork(network: Omit<SocialNetwork, 'id'>): Observable<SocialNetwork> {
    return this.http.post<SocialNetwork>(this.apiUrl, network);
  }

  /**
   * POST /api/v1/social-network/all/{businessId}
   * Guarda/sincroniza la lista completa de redes sociales para un negocio.
   */
  saveAllSocialNetworks(businessId: number, networks: SocialNetwork[]): Observable<SocialNetwork[]> {
    return this.http.post<SocialNetwork[]>(`${this.apiUrl}/all/${businessId}`, networks);
  }

  /**
   * DELETE /api/v1/social-network/{id}
   * Elimina una red social específica.
   */
  deleteSocialNetwork(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}