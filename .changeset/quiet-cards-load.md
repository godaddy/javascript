---
'@godaddy/react': patch
---

Allow GoDaddy payment forms and wallets to load without an application ID. Continue passing configured application IDs and session overrides to Collect when supplied. Only load the Collect SDK when the session has a configured GoDaddy payment method.
