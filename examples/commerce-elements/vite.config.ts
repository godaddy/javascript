import { createCheckoutSession } from '@godaddy/react/client';
import type { IncomingMessage } from 'node:http';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const SCOPES =
  'commerce.order:create commerce.order:read commerce.order:update commerce.product:read commerce.store:read';

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Dev-only checkout route, standing in for the server route a real site owns.
 * The OAuth client secret and the access token stay on the server side of
 * Vite; the page only ever receives the hosted session's id and URL.
 */
function commerceCheckout(env: Record<string, string>): Plugin {
  let cached: { accessToken: string; expiresAt: number } | undefined;
  const host = (env.VITE_GODADDY_API_HOST || 'api.godaddy.com').replace(
    /^https?:\/\//,
    ''
  );

  async function accessToken(): Promise<string> {
    if (cached && cached.expiresAt - 60_000 > Date.now())
      return cached.accessToken;
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
    return cached.accessToken;
  }

  return {
    name: 'commerce-checkout',
    configureServer(server) {
      server.middlewares.use('/api/commerce/checkout', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('{"error":"POST only"}');
          return;
        }
        try {
          const { reference, storeId: _s, channelId: _c, ...input } =
            await readJson(req);
          if (reference !== undefined) {
            // A real server prices the reference from its own invoice data here.
            res.statusCode = 400;
            res.end('{"error":"This demo has no invoice source for standalone payments"}');
            return;
          }
          const session = await createCheckoutSession(
            {
              // The server owns the storefront binding; browser values are ignored.
              ...(input as Parameters<typeof createCheckoutSession>[0]),
              storeId: env.VITE_GODADDY_STORE_ID,
              channelId: env.VITE_GODADDY_CHANNEL_ID,
            },
            { accessToken: await accessToken(), apiHost: host }
          );
          res.end(
            JSON.stringify({
              id: session?.id,
              url: session?.url,
              storeId: session?.storeId,
              channelId: session?.channelId,
            })
          );
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
    plugins: [react(), commerceCheckout(env)],
    server: { port: 5180, strictPort: true },
  };
});
