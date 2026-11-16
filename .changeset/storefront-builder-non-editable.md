---
"@godaddy/gd-commerce-storefront": patch
---

Every `.commerce-storefront` wrapper, including the cart drawer, now has the attribute `data-dev-source-origin="commerce"`. The Airo site builder reads it as data from the Commerce API: a site owner can still select the components, for example to ask for a new style, but cannot edit or delete the product names, prices or cart text inside them. The markup is otherwise unchanged.
