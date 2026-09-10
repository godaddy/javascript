---
'@godaddy/commerce': patch
'@godaddy/react': patch
---

Add managed Commerce carts and one-time checkout through gddy web components, optional React bindings, and a public integration contract for a separately managed CDN. Expose browser Commerce API primitives and support embedded checkout completion, session isolation, and scoped UI containers. Checkout sessions are created through a server-side `createSession` hook that receives the payment reference; browser OAuth tokens require an explicit `dangerouslyAllowBrowserToken` opt-in. A `build:cdn` script produces the self-contained managed CDN runtime (`window.GddyCommerce`, `gddy:ready`, hashed immutable chunks) for the checkout repository to deploy.
