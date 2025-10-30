import type { ReactNode } from 'react';
import type { CardType } from '@/components/checkout/payment/card-info';
import AmexIcon from '@/components/checkout/payment/icons/Amex';
import DiscoverIcon from '@/components/checkout/payment/icons/Discover';
import MastercardIcon from '@/components/checkout/payment/icons/Mastercard';
import VisaIcon from '@/components/checkout/payment/icons/Visa';

const cardImages: Partial<Record<CardType, ReactNode>> = {
  visa: <VisaIcon className='h-4' />,
  mastercard: <MastercardIcon className='h-4' />,
  amex: <AmexIcon className='h-4' />,
  discover: <DiscoverIcon className='h-4' />,
};

export function CardIcon({ cardType }: { cardType: CardType }) {
  if (!cardType || !cardImages[cardType]) {
    return null;
  }

  // Return the component directly instead of an img tag
  return cardImages[cardType];
}

export function AnimatedCardIcon({
  cardType,
  supportedCards = ['visa', 'mastercard', 'amex'],
}: {
  cardType?: CardType;
  supportedCards?: CardType[];
}) {
  return (
    <div className='relative'>
      {/* List of cards */}
      <div className={`transition-opacity duration-300 flex gap-2 ${cardType ? 'opacity-0 hidden' : 'opacity-100'}`}>
        {supportedCards.map(card => (
          <CardIcon key={card} cardType={card} />
        ))}
      </div>
      {/* Single card */}
      <div className={`transition-opacity duration-300 flex ${cardType ? 'opacity-100' : 'opacity-0'}`}>
        {cardType && <CardIcon cardType={cardType} />}
      </div>
    </div>
  );
}
