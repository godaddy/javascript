---
"@godaddy/react": patch
---

Add optional `notes` prop to `Checkout` for overriding the notes-collection field's label and placeholder. Both fall back to localization (`t.general.notes` / `t.shipping.notesPlaceholder`) when omitted; pass an empty `placeholder` to render none. The override applies to the standalone notes section header and the `NotesForm` field.
