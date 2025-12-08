import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home-page.component';
import { CartaDigital } from './pages/carta-digital/carta-digital';
import { TuRestaurante } from './pages/tu-restaurante/tu-restaurante';
import { Precios } from './pages/precios/precios';
import { Contacto } from './pages/contacto/contacto';
import error404PageComponent from './pages/error/error404-page.component';
import { Login } from './login/login';
import { CreateBusiness } from './create-business/create-business';
import { DetallesNegocioComponent } from './detalles-negocio/detalles-negocio';
import { PanelControlBuisiness } from './panel-control-buisiness/panel-control-buisiness';
import { RegristoLogin } from './login/regristo-login/regristo-login';
import { RecoveryPassword } from './login/recovery-password/recovery-password';
import { EditarContacto } from './editar-contacto/editar-contacto';
import { EditarWifi } from './editar-wifi/editar-wifi';
import { EditarInstalaciones } from './editar-instalaciones/editar-instalaciones';
import { EditarHorario } from './editar-horario/editar-horario';
import { EditarCamposHorarioApertura } from './editar-horario/editar-campos-horario-apertura/editar-campos-horario-apertura';
import { EditarMenu } from './editar-menu/editar-menu';

export const routes: Routes = [
  { path: 'home', component: HomePageComponent },
  { path: 'carta-digital', component: CartaDigital },
  { path: 'tu-restaurante', component: TuRestaurante },
  { path: 'precios', component: Precios },
  { path: 'contacto', component: Contacto },
  { path: 'login', component: Login },
  { path: 'crear-negocio', component: CreateBusiness },
  { path: 'negocio/:id', component: DetallesNegocioComponent },
  { path: 'panel-control-buisiness/:businessId', component: PanelControlBuisiness },
  { path: 'registro', component: RegristoLogin },
  { path: 'recuperar-contraseña', component: RecoveryPassword },
  { path: 'editar-contacto', component: EditarContacto },
  { path: 'editar-wifi', component:EditarWifi},
  { path: 'editar-instalaciones', component: EditarInstalaciones},
  { path: 'editar-horario', component: EditarHorario},
  { path: 'editar-campos-horario-apertura', component: EditarCamposHorarioApertura},
  { path: 'editar-menu', component: EditarMenu},
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', component: error404PageComponent }
];