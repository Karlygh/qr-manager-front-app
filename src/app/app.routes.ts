import { Routes } from '@angular/router';

// 1. IMPORTACIONES DE PÁGINAS (Usando la clase exacta y la ruta .component)
import { HomePageComponent } from './pages/home/home-page.component'; 
import { CartaDigital } from './pages/carta-digital/carta-digital'; 
import { TuRestaurante } from './pages/tu-restaurante/tu-restaurante'; 
import { Precios } from './pages/precios/precios'; 
import { Contacto } from './pages/contacto/contacto'; 
import error404PageComponent from './pages/error/error404-page.component';
import { Comienzagratis } from './comienzagratis/comienzagratis';
import { Login } from './login/login';

export const routes: Routes = [
  // RUTAS PRINCIPALES
  { path: 'home', component: HomePageComponent },
  { path: 'carta-digital', component: CartaDigital }, 
  { path: 'tu-restaurante', component: TuRestaurante }, 
  { path: 'precios', component: Precios }, 
  { path: 'contacto', component: Contacto }, 
  { path: 'comienzagratis', component: Comienzagratis },
  { path: 'login',component: Login},
  
  

  // REDIRECCIÓN Y ERROR
  { path: '', redirectTo: '/home', pathMatch: 'full' }, 
  { path: '**', component: error404PageComponent }
];