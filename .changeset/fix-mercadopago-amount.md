---
"@godaddy/react": patch
---

Fix MercadoPago amount conversion from minor units to major units. The SDK expects amounts in major units (e.g., 90.00 BRL) but we were sending minor units (e.g., 9000 cents).
