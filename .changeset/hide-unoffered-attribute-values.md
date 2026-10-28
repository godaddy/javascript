---
"@godaddy/gd-commerce-storefront": minor
---

The product page leaves out attribute values that no active SKU has. Before, a product with five sizes but SKUs in only two showed all five, and choosing one of the other three showed "This combination is unavailable. Choose different options." A link with such a value, such as `?option.size=s`, now counts as that option not chosen. This needs every SKU with its attribute values, which `@godaddy/gd-commerce-server` 0.4.0 and later return for up to 50 SKUs. For a product with more SKUs, or with an older server, every value is still shown. An attribute that no SKU has a value for keeps all its values.
