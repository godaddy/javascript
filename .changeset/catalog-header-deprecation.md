---
"@godaddy/gd-commerce-storefront": patch
---

Deprecate `Catalog`'s `title`, `description` and `showHeader` props. They still work. Compose `CatalogRoot` with `<CatalogHeader title='…' description='…' />` instead, or leave `CatalogHeader` out when the page renders its own H1. Catalog loading placeholders now render inside the `CatalogProducts` element, so they follow the host's grid. The packaged catalog's placeholders now use its loaded spacing from the `lg` breakpoint, 32px between cards and 40px above and below, instead of 24px and 32px.
