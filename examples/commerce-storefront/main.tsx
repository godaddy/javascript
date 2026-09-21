import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router';
import { Catalog, CartButton, CommerceStorefront, ProductDetails } from '@godaddy/commerce-storefront';
import '@godaddy/commerce-storefront/styles.css';
import './styles.css';

const client = new QueryClient();
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={client}>
    <BrowserRouter>
      <CommerceStorefront theme={{ '--commerce-accent': '#174c3c', '--commerce-accent-hover': '#10362b' }}>
        <a className='skip-link' href='#main'>Skip to products</a>
        <header className='site-header'><Link to='/shop'>Field & Form</Link><CartButton /></header>
        <main id='main'>
          <p className='demo-note'>Demo catalog and in-memory cart. No orders or payments are created.</p>
          <Routes>
            <Route path='/shop' element={<Catalog title='Everyday essentials' description='Useful objects, thoughtfully made.' />} />
            <Route path='/products/:productId' element={<ProductDetails />} />
            <Route path='*' element={<Navigate to='/shop' replace />} />
          </Routes>
        </main>
        <footer>Independent React app · No app-builder runtime · No Tailwind configuration</footer>
      </CommerceStorefront>
    </BrowserRouter>
  </QueryClientProvider>
);
