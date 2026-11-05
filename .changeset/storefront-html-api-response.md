---
"@godaddy/gd-commerce-storefront": patch
---

Show "The store could not be reached" instead of a JSON parse error when an `/api/commerce` route answers with the app's HTML page, such as an unmounted route behind a single-page app fallback or an HTML 404 page. The failure has status 502 rather than the page's status, so an HTML 404 never clears the saved cart. Development builds log which route returned HTML and how to mount the Commerce routes. The new `apiUnavailable` message has English and French text.
