import http from 'node:http';
import https from 'node:https';

// Buffer PHP responses before forwarding. Navigation cancellation must not leave
// an undici parser attached to a closing connection.
export function apiRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const headers = new Headers(options.headers);
    for (const key of ['host', 'connection', 'content-length', 'transfer-encoding', 'accept-encoding']) headers.delete(key);
    const request = (target.protocol === 'https:' ? https : http).request(target, {
      method: options.method || 'GET', agent: false,
      headers: { ...Object.fromEntries(headers), connection: 'close' }, signal: options.signal,
    }, response => {
      const chunks = [];
      let length = 0;
      response.on('data', chunk => {
        length += chunk.length;
        if (length > 8 * 1024 * 1024) request.destroy(new Error('Resposta da API excedeu o limite.'));
        else chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => {
        const forwarded = new Headers();
        for (const [key, values] of Object.entries(response.headers)) {
          if (['connection','content-length','transfer-encoding','content-encoding','keep-alive'].includes(key)) continue;
          for (const value of Array.isArray(values) ? values : [values]) if (value !== undefined) forwarded.append(key, value);
        }
        const status = response.statusCode || 502;
        resolve(new Response([204, 304].includes(status) ? null : Buffer.concat(chunks), { status, headers: forwarded }));
      });
    });
    request.setTimeout(30000, () => request.destroy(new Error('A API não respondeu a tempo.')));
    request.on('error', reject);
    if (options.body) request.write(Buffer.from(options.body));
    request.end();
  });
}
