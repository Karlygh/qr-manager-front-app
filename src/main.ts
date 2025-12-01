import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app'; // Usa la clase App
import { provideRouter } from '@angular/router'; 
import { routes } from './app/app.routes'; 
import { provideHttpClient } from '@angular/common/http'; // <-- nuevo

bootstrapApplication(App, { 
  providers: [
    provideRouter(routes),
    provideHttpClient(), // <-- agregado
    
  ]
}).catch(err => console.error(err));
