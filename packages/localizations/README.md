# @godaddy/localizations

Internationalization localizations for GoDaddy checkout components.

## Installation

```bash
npm install @godaddy/localizations
# or
pnpm add @godaddy/localizations
# or  
yarn add @godaddy/localizations
```

## Usage

```tsx
import { frFr } from "@godaddy/localizations";
import { GoDaddyProvider, Checkout } from "@godaddy/react";

function App() {
  return (
    <GoDaddyProvider localization={frFr}>
      <Checkout />
    </GoDaddyProvider>
  );
}
```

## Available Localizations

- `frFr` - French (France)

## Localization Structure

Each localization export contains the following sections:

- `general` - General UI text (optional, notes, quantity, etc.)
- `contact` - Contact form labels
- `pickup` - Local pickup configuration
- `delivery` - Delivery and shipping options
- `tips` - Tip/gratuity options
- `shipping` - Shipping address form
- `billing` - Billing address form
- `payment` - Payment methods and form
- `phone` - Phone number input
- `discounts` - Discount code functionality
- `totals` - Order totals and summary
- `lineItems` - Line item display
- `ui` - UI component labels and accessibility text
- `errors` - Error messages and validation
- `validation` - Form validation messages

## Contributing

To add a new localization:

1. Create a new file in `src/` with the locale code (e.g., `esEs.ts` for Spanish)
2. Copy the structure from `frFr.ts` and translate all strings
3. Export the new localization in `src/index.ts`
4. Add documentation to this README

## License

MIT
