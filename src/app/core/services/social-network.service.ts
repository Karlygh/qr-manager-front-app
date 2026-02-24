import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SocialNetwork } from '../../shared/models/social-network.model';

@Injectable({
  providedIn: 'root'
})
export class SocialNetworkService {
  // Asegúrate de que esta URL base sea correcta
  private apiUrl = 'http://91.107.235.58:8081/api/v1/social-network'; 

  // Headers para asegurar que se envía y recibe JSON
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  /**
   * GET /api/v1/social-network/{businessId}
   * Obtiene la lista de redes sociales de un negocio.
   */
  getSocialNetworksByBusinessId(businessId: number): Observable<SocialNetwork[]> {
    return this.http.get<SocialNetwork[]>(
      `${this.apiUrl}/${businessId}`,
      this.httpOptions
    );
  }

  /**
   * POST /api/v1/social-network
   * Crea una red social individual.
   */
  createSocialNetwork(network: Omit<SocialNetwork, 'id'>): Observable<SocialNetwork> {
    return this.http.post<SocialNetwork>(
      this.apiUrl, 
      network,
      this.httpOptions
    );
  }

  /**
   * POST /api/v1/social-network/all/{businessId}
   * Guarda/sincroniza la lista completa de redes sociales para un negocio.
   */
  saveAllSocialNetworks(businessId: number, networks: SocialNetwork[]): Observable<SocialNetwork[]> {
    return this.http.post<SocialNetwork[]>(
      `${this.apiUrl}/all/${businessId}`, 
      networks,
      this.httpOptions
    );
  }

  /**
   * PATCH /api/v1/social-network/{id}
   * Actualiza una red social específica.
   */
  updateSocialNetwork(id: number, network: Partial<SocialNetwork>): Observable<SocialNetwork> {
    return this.http.patch<SocialNetwork>(
      `${this.apiUrl}/${id}`,
      network,
      this.httpOptions
    );
  }

  /**
   * DELETE /api/v1/social-network/{id}
   * Elimina una red social específica por su ID.
   */
  deleteSocialNetwork(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
      this.httpOptions
    );
  }

  /**
   * DELETE /api/v1/social-network/all/{businessId}
   * Elimina todas las redes sociales de un negocio.
   */
  deleteAllSocialNetworks(businessId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/all/${businessId}`,
      this.httpOptions
    );
  }
}