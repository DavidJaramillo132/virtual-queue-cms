import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HttpHeaders, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { ApolloLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { authInterceptor } from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
    // Proveedor HTTP con interceptor de autenticacion para refresh automatico de tokens
    provideHttpClient(withInterceptors([authInterceptor])),
    provideApollo(() => {
      const httpLink = inject(HttpLink);

      const authLink = setContext(() => {
        const token = localStorage.getItem('token') ?? '';

        return {
          headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
        };
      });

      return {
        link: ApolloLink.from([
          authLink,
          httpLink.create({ uri: 'http://localhost:5000/graphql' })
        ]),
        cache: new InMemoryCache(),
      };
    }),
  ]
};
