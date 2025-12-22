'use client';

import { Target, useGoDaddyContext } from '@godaddy/react';
import Products from './products';

export default function StorePage() {
  const { storeId } = useGoDaddyContext();

  return (
    <div className='p-4'>
      {storeId && (
        <div className='mb-4'>
          <h2 className='text-lg font-semibold mb-2'>Store Extensions</h2>
          <Target
            id='store.home.before'
            entityId={storeId}
            entityType='STORE'
          />
        </div>
      )}

      <Products />

      {storeId && (
        <div className='mt-4'>
          <Target
            id='store.home.after'
            entityId={storeId}
            entityType='STORE'
          />
        </div>
      )}
    </div>
  );
}
