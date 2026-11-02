---
"@godaddy/gd-commerce-storefront": minor
---

A site can show its own sample products before a store is connected. `sampleProducts` on `Catalog` and `CatalogRoot` takes an array as well as `true`. Each sample has a `key`, `name` and `price`, and optionally a `compareAtPrice`, `description` and `imageUrl`, such as a file in the site's public folder. The card parts show a sample's image, description, price and Sale badge, and the sample cart keeps each line's image. `CatalogRoot` throws for an empty list, duplicate or empty keys, or invalid prices. `sampleProducts` still shows samples only while the server reports `unbound`, and `true` still shows the six packaged samples without images.

Custom parts can read the site's own sample fields. `useProductCard()` and `useCartItem()` return `sample`, typed with the site's sample type, such as `useProductCard<MySample>()`. A new `useCatalog()` returns the catalog's `count`, `isSample` and `status` for a custom product count. Card images and their loading placeholders follow a new `--commerce-card-image-aspect` theme property, which defaults to square. The `SampleProduct` and `CatalogState` types are exported. The default design is unchanged.
