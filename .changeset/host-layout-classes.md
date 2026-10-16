---
"@godaddy/gd-commerce-storefront": patch
---

Host layout classes now take effect on `ProductDetailsPrice`, `ProductDetailsOptions`, `ProductDetailsPurchase` and `CatalogPagination`. For example, `<ProductDetailsOptions className='grid grid-cols-2 gap-4' />` puts the selects in two columns. `ProductDetailsRoot` and `CatalogRoot` keep the host `className` while connecting, loading or showing an error. A card's image link is hidden from keyboard and screen reader users in server HTML when the card has a title. A `CatalogProducts` card template of `false` or an empty string renders the packaged card. Default rendering is unchanged.
