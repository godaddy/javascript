import { Checkout, GoDaddyProvider } from '@godaddy/react';
import { useState } from 'react';
import './checkout.generated.css';
import type { CommerceClient } from './client';
import type { Session } from './types';

export default function CheckoutView({
  client,
  session,
  onComplete,
  onConfirmingChange,
}: {
  client: CommerceClient;
  session: Session;
  onComplete: () => void;
  onConfirmingChange: (confirming: boolean) => void;
}) {
  const { clientId, storeId, channelId, apiHost, locale, payment } =
    client.config;
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div className='gddy-checkout-scope' ref={setContainer}>
      {container && (
        <GoDaddyProvider
          uiContainer={container}
          clientId={clientId}
          storeId={storeId}
          channelId={channelId}
          apiHost={apiHost}
          locale={locale}
        >
          <Checkout
            key={session.id}
            session={session}
            {...payment}
            embedded
            onComplete={onComplete}
            onConfirmingChange={onConfirmingChange}
          />
        </GoDaddyProvider>
      )}
    </div>
  );
}
