import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home-page.component';
import { CartaDigital } from './pages/pages-navbar/carta-digital/carta-digital';
import { TuRestaurante } from './pages/pages-navbar/tu-restaurante/tu-restaurante';
import { Precios } from './pages/pages-navbar/precios/precios';
import { Contacto } from './pages/pages-navbar/contacto/contacto';
import error404PageComponent from './pages/error/error404-page.component';
import { Login } from './pages/pages-navbar/login/login';
import { CreateBusiness } from './pages/pages-crear-negocio-y-producto/create-business/create-business';
import { DetallesNegocioComponent } from './pages/pages-panel-control-user/detalles-negocio/detalles-negocio';
import { PanelControlBuisiness } from './pages/pages-panel-control-user/panel-control-buisiness/panel-control-buisiness';
import { RegristoLogin } from './pages/pages-navbar/login/regristo-login/regristo-login';
import { RecoveryPassword } from './pages/pages-navbar/login/recovery-password/recovery-password';
import { EditarContacto } from './pages/pages-panel-control-user/editar-contacto/editar-contacto';
import { EditarWifi } from './pages/pages-panel-control-user/editar-wifi/editar-wifi';
import { EditarInstalaciones } from './pages/pages-panel-control-user/editar-instalaciones/editar-instalaciones';
import { EditarHorario } from './pages/pages-panel-control-user/editar-horario/editar-horario';
import { EditarCamposHorarioApertura } from './pages/pages-panel-control-user/editar-horario/editar-campos-horario-apertura/editar-campos-horario-apertura';
import { EditarMenu } from './pages/pages-panel-control-user/editar-menu/editar-menu';
import { EditarRedesComponent } from './pages/pages-panel-control-user/editar-redes/editar-redes';
import { CrearProducto } from './pages/pages-crear-negocio-y-producto/crear-producto/crear-producto';
import { CartaPrincipalComponent } from './pages/pages-panel-control-user/carta-principal/carta-principal';
import { GoogleOpiniones } from './pages/pages-panel-control-user/google-opiniones/google-opiniones';


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
  { path: 'panel/:businessId/editar-redes', component:EditarRedesComponent},
  { path: 'crear-producto',component:CrearProducto },
  { path: 'carta-principal', component:CartaPrincipalComponent },
  { path: 'google-reseñas/:businessId', component:GoogleOpiniones },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', component: error404PageComponent }
];