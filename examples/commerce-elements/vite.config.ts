import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const SCOPES =
  'commerce.order:create commerce.order:read commerce.order:update commerce.product:read commerce.store:read';

/**
 * Dev-only token endpoint. The OAuth client secret stays on the server side of
 * Vite; the page receives a short-lived client-credentials token for checkout.
 */
function commerceToken(env: Record<string, string>): Plugin {
  let cached: { accessToken: string; expiresAt: number } | undefined;
  return {
    name: 'commerce-token',
    configureServer(server) {
      server.middlewares.use('/api/commerce-token', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('{"error":"POST only"}');
          return;
        }
        try {
          if (!cached || cached.expiresAt - 60_000 < Date.now()) {
            const host = (env.VITE_GODADDY_API_HOST || 'api.godaddy.com').replace(
              /^https?:\/\//,
              ''
            );
            const clientId = env.GODADDY_OAUTH_CLIENT_ID;
            const clientSecret = env.GODADDY_OAUTH_CLIENT_SECRET;
            if (!clientId || !clientSecret)
              throw new Error(
                'Set GODADDY_OAUTH_CLIENT_ID and GODADDY_OAUTH_CLIENT_SECRET in .env.local'
              );
            const response = await fetch(`https://${host}/v2/oauth2/token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
                scope: SCOPES,
              }),
            });
            if (!response.ok)
              throw new Error(
                `Token request failed: ${response.status} ${await response.text()}`
              );
            const json = (await response.json()) as {
              access_token: string;
              expires_in: number;
            };
            cached = {
              accessToken: json.access_token,
              expiresAt: Date.now() + json.expires_in * 1000,
            };
          }
          res.end(JSON.stringify({ accessToken: cached.accessToken }));
        } catch (error) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: String(error) }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), commerceToken(env)],
    server: { port: 5180, strictPort: true },
  };
});
