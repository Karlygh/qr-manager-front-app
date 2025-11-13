import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app'; // Usa la clase App
import { provideRouter } from '@angular/router'; 
import { routes } from './app/app.routes'; 

bootstrapApplication(App, { 
  providers: [
    provideRouter(routes) 
  ]
}).catch(err => console.error(err));