---
'@godaddy/gd-commerce-server': patch
---

Stop returning the internal error message in 500 responses from the catalog, cart, and checkout routes. These routes now respond with only `{ "error": "<label>" }` and log the underlying error server-side with `console.error`. Hosts that read `message` from these responses should log server-side instead.
