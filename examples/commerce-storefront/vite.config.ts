import { randomUUID } from 'node:crypto';
import { defineConfig, type Plugin } from 'vite';
import type { CartOrder, SKU, SKUGroup } from '@godaddy/commerce-storefront';

const money = (value: number) => ({ value, currencyCode: 'USD' });
const sku = (id: string, price: number, quantity = 20): SKU => ({
  id, prices: { edges: [{ node: { value: money(price) } }] },
  inventoryCounts: { edges: [{ node: { type: 'AVAILABLE', quantity } }] },
});
const mug = sku('mug', 2400);
const blue = sku('tote-blue', 3600);
const clay = sku('tote-clay', 3800, 0);
const products: SKUGroup[] = [
  { id: 'mug', label: 'Studio mug', description: 'A sturdy ceramic mug for slow mornings.', priceRange: { min: 2400, max: 2400 }, skus: { edges: [{ node: mug }], totalCount: 1 } },
  { id: 'tote', label: 'Market tote', description: 'Choose a color for your everyday carry.', priceRange: { min: 3600, max: 3800 }, attributes: { edges: [{ node: { id: 'color', name: 'color', label: 'Color', values: { edges: [{ node: { name: 'blue', label: 'Blue' } }, { node: { name: 'clay', label: 'Clay' } }] } } }] }, skus: { edges: [{ node: blue }, { node: clay }], totalCount: 2 } },
];

// Demonstration only. This is neither a production server nor a Commerce API emulator.
function demoApi(): Plugin {
  const carts = new Map<string, CartOrder>();
  return { name: 'storefront-demo-api', configureServer(server) {
    server.middlewares.use('/api/commerce', async (req, res, next) => {
      try {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const send = (value: unknown, status = 200) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
        if (url.pathname === '/config') return send({ cartScope: 'demo-v1', currencyCode: 'USD' });
        if (url.pathname === '/products') return send({ skuGroups: { edges: products.map(node => ({ node })), pageInfo: { hasNextPage: false } } });
        if (url.pathname.startsWith('/products/')) {
          const product = products.find(item => item.id === url.pathname.split('/')[2]);
          const color = url.searchParams.get('attributeValues');
          return send({ skuGroup: product && color ? { ...product, skus: { edges: color === 'blue' ? [{ node: blue }] : color === 'clay' ? [{ node: clay }] : [], totalCount: 1 } } : product ?? null });
        }
        if (!url.pathname.startsWith('/cart')) return next();
        if (req.headers['x-commerce-scope'] !== 'demo-v1') return send({ error: 'Store changed. Reload the page.' }, 409);
        let body = '';
        for await (const chunk of req) body += chunk;
        const input = body ? JSON.parse(body) : {};
        const [, , cartId, , itemId] = url.pathname.split('/');
        let cart = carts.get(cartId);
        if (req.method === 'GET') return send(cart ? { cart } : { error: 'Cart expired.' }, cart ? 200 : 404);
        if (!cart && url.pathname !== '/cart') return send({ error: 'Cart expired.' }, 404);
        cart ??= { id: randomUUID(), lineItems: [] };
        if (req.method === 'POST') {
          for (const item of input.lineItems ?? [input]) {
            const selected = [mug, blue, clay].find(s => s.id === item.skuId);
            if (!selected || selected === clay || !Number.isInteger(item.quantity) || item.quantity < 1) return send({ error: 'This variant is unavailable.' }, 400);
            const price = selected.prices!.edges![0]!.node!.value!.value!;
            const existing = cart.lineItems!.find(line => line.skuId === item.skuId);
            if (existing) { existing.quantity = (existing.quantity ?? 0) + item.quantity; existing.totals = { subTotal: money(existing.quantity! * price) }; }
            else cart.lineItems!.push({ id: randomUUID(), skuId: item.skuId, name: item.name, quantity: item.quantity, totals: { subTotal: money(price * item.quantity) } });
          }
        }
        if (req.method === 'PATCH') {
          const item = cart.lineItems!.find(line => line.id === itemId);
          if (!item || !Number.isInteger(input.quantity) || input.quantity < 1) return send({ error: 'Invalid quantity.' }, 400);
          const unit = item.totals!.subTotal!.value! / item.quantity!;
          item.quantity = input.quantity; item.totals = { subTotal: money(unit * input.quantity) };
        }
        if (req.method === 'DELETE') cart.lineItems = cart.lineItems!.filter(line => line.id !== itemId);
        const total = cart.lineItems!.reduce((sum, item) => sum + (item.totals?.subTotal?.value ?? 0), 0);
        cart.totals = { subTotal: money(total), total: money(total) };
        carts.set(cart.id!, cart); send({ cart });
      } catch { res.statusCode = 500; res.end(JSON.stringify({ error: 'Demo server failed.' })); }
    });
  } };
}
export default defineConfig({ plugins: [demoApi()] });
