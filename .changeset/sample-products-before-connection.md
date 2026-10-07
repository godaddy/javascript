---
"@godaddy/gd-commerce-storefront": minor
"@godaddy/gd-commerce-server": minor
---

Support storefronts that are not connected to a store yet. `Catalog sampleProducts` shows built-in sample products and a local sample cart only while the server reports `unbound`, and the components switch to the connected store automatically, without source changes. Unknown state, empty live catalogs, and failures never show samples. Add optional `CommerceConfiguration.readConnectionState()` to the server config contract, and reject live operations until the state is `ready`. Existing successful config responses and live cart behavior are unchanged.
