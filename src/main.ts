import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app'; 
import { provideRouter } from '@angular/router'; 
import { routes } from './app/app.routes'; 
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

bootstrapApplication(App, { 
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()), 
    
  ]
}).catch(err => console.error(err));
