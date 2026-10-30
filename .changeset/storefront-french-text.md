---
'@godaddy/gd-commerce-storefront': minor
---

Translate the storefront's text. `CommerceProvider` takes a `messages` prop, separate from `locale`, and the package ships French as `frFR` from `@godaddy/gd-commerce-storefront/messages/fr-FR`. Keys a site leaves out stay English. Plurals follow the language's rules, and server failures show translated text by their `code`. Price ranges are formatted for the `locale`, so German and French write `20,00–25,00 €`. `useMessage` and `useMoneyRange` give custom parts the same text and formatting. Error events from `onEvent` carry the translated `message` and the server's `code`. `getCartSummaryTotals` takes a fallback currency, such as the store's.
