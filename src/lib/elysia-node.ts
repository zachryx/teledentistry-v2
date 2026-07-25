import http from 'http';

export function attachElysiaToNodeServer(server: http.Server, app: { fetch(req: Request): Response | Promise<Response> }) {
  server.on('request', async (req: http.IncomingMessage, res: http.ServerResponse) => {
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;

      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
          else headers.set(key, value);
        }
      }

      const request = new Request(url.toString(), {
        method: req.method,
        headers,
        body: body?.length ? body : undefined,
      });

      const response = await app.fetch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    } catch {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, message: 'Internal Server Error' }));
    }
  });
}
