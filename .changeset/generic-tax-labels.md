---
"@godaddy/localizations": patch
---

Use generic tax labels for combined tax totals. `enAu` no longer shows "Estimated GST", "GST included" or GST-specific tax errors. `enUs`, `esUs` and `frCa` now say "Taxes included" / "Impuestos incluidos" / "Taxes incluses" instead of naming VAT, IVA or TVA. Add an `enCa` localization so Canadian checkouts no longer need to borrow `enAu`.
