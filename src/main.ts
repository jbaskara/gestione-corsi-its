// Import di Zone.js (necessario per Angular)
import 'zone.js';

import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { isDevMode } from '@angular/core';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { apiInterceptor } from './app/shared/api.interceptor';

// Bootstrap dell'app con provider principali:
// - Router con le rotte dell'app
// - HttpClient con l'interceptor API
// - Animazioni (necessarie per Angular Material)
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideAnimations(),
  ],
})
  .then(() => {
    // Piccolo log utile in dev; innocuo in produzione
    if (isDevMode()) {
      console.info('[Angular] Applicazione avviata in modalità sviluppo');
    }
  })
  .catch((err) => console.error(err));