import { apiRequest } from './lib/server/transport.js';

async function route({ event, resolve }) {
  if (event.url.pathname.startsWith("/api/")) {
    try {
      const headers = new Headers(event.request.headers);
      headers.delete("host");
      headers.delete("connection");
      const target = new URL(
        event.url.pathname + event.url.search,
        process.env.API_INTERNAL_URL || "http://127.0.0.1:8000",
      );
      const response = await apiRequest(target, {
        method: event.request.method,
        headers,
        body: ["GET", "HEAD"].includes(event.request.method)
          ? undefined
          : await event.request.arrayBuffer(),
        redirect: "manual",
        signal: AbortSignal.timeout(20000),
      });
      return response;
    } catch {
      return Response.json(
        { message: "O serviço está indisponível. Tente novamente." },
        { status: 503 },
      );
    }
  }
  return resolve(event);
}

export async function handleFetch({ event, request, fetch }) {
  const base = process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000';
  if (new URL(request.url).origin !== new URL(base).origin) return fetch(request);
  const headers = new Headers(request.headers);
  if (!headers.has('cookie') && event.request.headers.has('cookie')) headers.set('cookie', event.request.headers.get('cookie'));
  return apiRequest(request.url, { method: request.method, headers,
    body: ['GET','HEAD'].includes(request.method) ? undefined : await request.arrayBuffer() });
}

export async function handle(args) {
  const { event } = args;
  // Mutations proxied to the API must originate from this site; Laravel still validates CSRF.
  if (event.url.pathname.startsWith('/api/') && !['GET','HEAD','OPTIONS'].includes(event.request.method)) {
    const origin = event.request.headers.get('origin');
    if (origin !== event.url.origin) return Response.json({message:'Origem da solicitação inválida.'},{status:403});
  }
  const response = await route(args);
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options','DENY');
  response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  if (event.url.pathname.startsWith('/api/') && !event.url.pathname.startsWith('/api/v1/sprite/')) response.headers.set('Cache-Control','private, no-store');
  return response;
}
