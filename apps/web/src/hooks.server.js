export async function handle({ event, resolve }) {
  if (event.url.pathname.startsWith("/api/")) {
    try {
      const headers = new Headers(event.request.headers);
      headers.delete("host");
      headers.delete("connection");
      const target = new URL(
        event.url.pathname + event.url.search,
        process.env.API_INTERNAL_URL || "http://127.0.0.1:8000",
      );
      const response = await fetch(target, {
        method: event.request.method,
        headers,
        body: ["GET", "HEAD"].includes(event.request.method)
          ? undefined
          : await event.request.arrayBuffer(),
        redirect: "manual",
      });
      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      });
    } catch {
      return Response.json(
        { message: "O serviço está indisponível. Tente novamente." },
        { status: 503 },
      );
    }
  }
  return resolve(event);
}
