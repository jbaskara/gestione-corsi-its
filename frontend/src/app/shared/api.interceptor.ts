import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor che premette il base URL del backend alle chiamate che iniziano con /api/.
 * Nota: per ambienti diversi, preferisci leggere il base URL da environment.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBase = 'http://localhost:8000';
  const isApi = req.url.startsWith('/api/');
  const cloned = isApi ? req.clone({ url: `${apiBase}${req.url}` }) : req;
  return next(cloned);
};