import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router';
import { Catalog, CartButton, CommerceStorefront, ProductDetails } from '@godaddy/gd-commerce-storefront';
import '@godaddy/gd-commerce-storefront/styles.css';
import './styles.css';

const client = new QueryClient();
function DevelopmentControls() {
  const [status, setStatus] = useState('Unbound template');
  return <fieldset className='demo-note'>
    <legend>Local template test controls</legend>
    <label>Server state <select defaultValue='unbound' onChange={async event => {
      const state = event.target.value;
      const response = await fetch('/__demo/commerce-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) });
      setStatus(response.ok ? `${state}: applies at the next configuration refresh` : 'Could not change local state');
    }}>
      <option value='unbound'>Unbound</option><option value='connecting'>Connecting</option>
      <option value='error'>Configuration error</option><option value='live-empty'>Live empty catalog (simulated)</option><option value='live'>Existing live demo (simulated)</option>
    </select></label>{' '}
    <button type='button' onClick={() => void client.refetchQueries({ queryKey: ['commerce', 'configuration'] })}>Refresh configuration</button>
    <p role='status'>{status}. Unbound/connecting pages refresh automatically every 5 seconds.</p>
  </fieldset>;
}
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={client}>
    <BrowserRouter>
      <CommerceStorefront theme={{ '--commerce-accent': '#174c3c', '--commerce-accent-hover': '#10362b' }}>
        <a className='skip-link' href='#main'>Skip to products</a>
        <header className='site-header'><Link to='/'>Template example</Link><nav><Link to='/'>Home</Link>{' · '}<Link to='/shop'>Shop</Link></nav><CartButton /></header>
        <main id='main'>
          <p className='demo-note'>Local template demonstration. Example products and prices. No orders or payments are created.</p>
          {import.meta.env.DEV && <DevelopmentControls />}
          <Routes>
            <Route path='/' element={<><h1>Your template storefront</h1><p>The same catalog and cart activate when a store connects.</p><Catalog sampleProducts showHeader={false} /></>} />
            <Route path='/shop' element={<Catalog sampleProducts title='Browse products' description='A reusable storefront template.' />} />
            <Route path='/products/:productId' element={<ProductDetails />} />
            <Route path='*' element={<Navigate to='/shop' replace />} />
          </Routes>
        </main>
        <footer>Independent React app · No Tailwind configuration</footer>
      </CommerceStorefront>
    </BrowserRouter>
  </QueryClientProvider>
);
