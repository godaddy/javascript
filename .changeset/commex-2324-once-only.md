---
'@godaddy/app-connect': minor
---

Add a once-only helper, exported from the package root and from `@godaddy/app-connect/once`. `once(store, key, fn, { leaseMs })` records one outcome per key, runs `fn` one caller at a time, and answers `done`, `duplicate`, `in_flight` or `refused` (when `fn` throws `Refused`). A claim whose lease passes is taken over, so work a crashed instance held is retried instead of lost; work that outlives its lease can run again, so pair it with an idempotency key.

Stores implement `OnceStore`. `createMysqlOnceStore` keeps claims in MySQL 8 or later through a `mysql2/promise` pool and ships its table DDL (`onceTableDdl`); `createMemoryOnceStore` is for tests and local runs. `deriveId(namespace, name)` builds RFC 9562 version 5 ids for stable keys and idempotency keys.
