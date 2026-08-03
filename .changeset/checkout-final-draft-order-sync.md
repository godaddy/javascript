---
'@godaddy/react': patch
---

Centralize draft-order syncing behind a registration-based sync controller and run a
single final sync before checkout confirmation.

- Form sections (contact, phone, address, notes) now register how their current values
  map to a draft-order patch instead of firing their own debounced updates.
- On confirm, checkout drains any queued sync work, diffs the current form values against
  the latest backend draft order, sends at most one final update, and refetches only when
  that update was sent — so in-flight edits (including name-only edits and pickup names)
  are no longer lost or duplicated.
- Background sync is suppressed once confirmation starts; only the final checkout sync may
  still write, and a failed final update blocks confirmation and surfaces the error.