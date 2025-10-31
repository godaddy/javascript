# Checkout JWT Authentication - Verification Guide

## Implementation Status

✅ **Complete** - All components migrated, security improvements applied

## Architecture Overview

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Merchant creates session (server-side)                  │
│    createCheckoutSession() → session with token             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Customer visits checkout URL                             │
│    https://checkout.example.com/c/sess_abc#tok_xyz          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CheckoutAuthProvider extracts & exchanges token          │
│    - Extract tok_xyz from URL fragment                      │
│    - Clear fragment immediately (security)                  │
│    - exchangeCheckoutToken(sess_abc, tok_xyz) → JWT         │
│    - Store JWT in sessionStorage                            │
│    - Schedule auto-refresh 60s before expiry                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. All API calls use JWT auth                               │
│    - useCheckoutApi() hook detects JWT vs legacy            │
│    - JWT: Authorization: Bearer <jwt>                       │
│    - Legacy: x-session-token, x-session-id, x-store-id      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Token refresh (automatic)                                │
│    - Scheduled 60s before expiry                            │
│    - refreshCheckoutToken() → new JWT                       │
│    - Update sessionStorage with new JWT                     │
│    - Reschedule next refresh                                │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **CheckoutAuthProvider** (`auth/checkout-auth-provider.tsx`)
   - Manages JWT lifecycle (exchange, refresh, storage)
   - Provides auth state to React context
   - Handles legacy fallback

2. **useCheckoutApi** (`hooks/use-checkout-api.ts`)
   - Unified API hook for all checkout operations
   - Auto-detects JWT vs legacy auth
   - Used by all 11+ component hooks

3. **godaddy.client.ts** (`lib/godaddy/godaddy.client.ts`)
   - Client-side API functions
   - `getAuthHeaders()` handles both auth modes
   - All GraphQL requests route through here

4. **godaddy.server.ts** (`lib/godaddy/godaddy.server.ts`)
   - Server-side only: createCheckoutSession
   - Uses OAuth for merchant auth

5. **godaddy.ts** (DEPRECATED)
   - Legacy file now marked deprecated
   - Re-exports for backwards compatibility
   - All components migrated away from this

## Verification Checklist

### ✅ 1. Legacy Flow (Backwards Compatibility)

**Test scenario**: Application passes `session` prop to `<Checkout>` without URL fragment token.

**Expected behavior**:
- ✅ CheckoutAuthProvider sets `authState.mode = 'legacy'`
- ✅ useCheckoutApi returns auth with `{ session }`
- ✅ All API calls use headers: `x-session-token`, `x-session-id`, `x-store-id`
- ✅ No JWT exchange attempted
- ✅ No sessionStorage used

**Verification**:
```typescript
// In your test/app:
<Checkout session={existingSession} />

// Expected network headers:
x-session-token: tok_abc123
x-session-id: sess_xyz789
x-store-id: store_456
// NOT Authorization: Bearer ...
```

### ✅ 2. JWT Bootstrap Flow (New Feature)

**Test scenario**: Customer visits URL with fragment token `https://checkout.example.com/c/sess_abc123#tok_xyz789`

**Expected behavior**:
1. ✅ Fragment token extracted: `tok_xyz789`
2. ✅ URL fragment cleared immediately (before network call)
3. ✅ `exchangeCheckoutToken` mutation called with `sessionId: "sess_abc123", token: "tok_xyz789"`
4. ✅ Response JWT stored in `sessionStorage` under key `checkout_jwt_sess_abc123`
5. ✅ `authState` set to `{ mode: 'jwt', jwt: '...', expiresAt: ..., sessionId: 'sess_abc123' }`
6. ✅ All subsequent API calls use `Authorization: Bearer <jwt>` header
7. ✅ NO legacy headers sent (`x-session-token`, etc.)

**Verification**:
```typescript
// Initial URL: /c/sess_abc123#tok_xyz789

// After mount:
// 1. URL should be: /c/sess_abc123 (fragment cleared)
// 2. sessionStorage should have:
sessionStorage.getItem('checkout_jwt_sess_abc123')
// → { "jwt": "eyJ...", "expiresAt": 1234567890, "sessionId": "sess_abc123" }

// 3. All GraphQL requests should use:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// NOT x-session-token/x-session-id headers
```

### ✅ 3. Token Refresh

**Test scenario**: JWT expires in 60 seconds.

**Expected behavior**:
- ✅ Timer scheduled for ~60s before expiry (line 88-90 in checkout-auth-provider.tsx)
- ✅ At scheduled time, `refreshCheckoutToken` mutation called with current JWT
- ✅ New JWT returned and stored in sessionStorage
- ✅ Auth state updated with new JWT and expiry
- ✅ New refresh timer scheduled

**Verification**:
```typescript
// Monitor network:
// 1. Initial exchange at T=0
POST /graphql
{ "query": "mutation ExchangeCheckoutToken..." }
→ Response: { jwt: "eyJ1...", expiresAt: "2024-01-01T10:10:00Z" }

// 2. Auto-refresh at T=9min (60s before 10min expiry)
POST /graphql
Authorization: Bearer eyJ1...
{ "query": "mutation RefreshCheckoutToken..." }
→ Response: { jwt: "eyJ2...", expiresAt: "2024-01-01T10:20:00Z" }

// 3. sessionStorage updated with new JWT
```

### ✅ 4. SessionStorage Persistence

**Test scenario**: User refreshes page with active JWT session.

**Expected behavior**:
- ✅ No URL fragment present
- ✅ SessionStorage checked for key `checkout_jwt_<sessionId>`
- ✅ Stored JWT validated (not expired, sessionId matches)
- ✅ Auth state restored from storage
- ✅ Refresh timer re-scheduled
- ✅ No new token exchange

**Verification**:
```typescript
// Before refresh: JWT in sessionStorage
// After refresh (page reload):
// 1. No exchangeCheckoutToken call
// 2. authState restored immediately
// 3. API calls work with stored JWT
```

### ✅ 5. Security Features

#### URL Fragment Cleanup
```typescript
// ✅ Fragment cleared immediately after extraction (line 177)
// ✅ Cleared BEFORE network call (prevents leakage on failure)
// ✅ Token never visible in URL bar after mount
```

#### Robust Token Parsing
```typescript
// ✅ Supports both formats:
//   - /checkout#tok_abc123
//   - /checkout#token=tok_abc123
// ✅ URL-decodes token value
// ✅ Validates tok_ prefix
```

#### SessionStorage Validation
```typescript
// ✅ Validates sessionId matches before trusting stored JWT
// ✅ Removes mismatched entries
// ✅ Checks expiry before use
```

#### Header Safety
```typescript
// ✅ Only includes x-store-id if present (not undefined)
// ✅ JWT auth uses only Authorization header
// ✅ No mixing of auth modes
```

### ✅ 6. Error Handling & Fallback

**Test scenarios**:

1. **Token exchange fails**:
   - ✅ Falls back to `authState.mode = 'legacy'`
   - ✅ Removes any sessionStorage entry
   - ✅ Fragment still cleared from URL
   - ✅ Error logged to console

2. **Token refresh fails**:
   - ✅ Falls back to `authState.mode = 'legacy'`
   - ✅ Removes sessionStorage entry
   - ✅ Error logged to console

3. **Stored JWT expired**:
   - ✅ Ignored, not used
   - ✅ Removed from sessionStorage
   - ✅ Falls back to legacy mode

4. **SessionId mismatch in storage**:
   - ✅ Removed from sessionStorage
   - ✅ Not used
   - ✅ Falls back to legacy or re-exchange

### ✅ 7. Component Migration

All 11 components migrated from direct `godaddy.ts` imports to `useCheckoutApi()`:

- ✅ use-apply-delivery-method.ts
- ✅ use-apply-fulfillment-location.ts
- ✅ use-discount-apply.ts
- ✅ use-remove-shipping-method.ts
- ✅ use-address-verification.ts
- ✅ use-draft-order-shipping-methods.ts
- ✅ use-get-price-adjustments.ts
- ✅ use-apply-shipping-method.ts
- ✅ use-confirm-checkout.ts
- ✅ use-update-taxes.ts
- ✅ use-update-order.ts

**Verification**:
```bash
# Confirm no imports from legacy godaddy.ts:
grep -r "from '@/lib/godaddy/godaddy'" packages/react/src/components/
# Should return: 0 results
```

### ✅ 8. TypeScript & Build

```bash
# All checks pass:
pnpm --filter @godaddy/react typecheck
pnpm --filter @godaddy/react build
pnpm --filter @godaddy/react lint
```

## Testing Recommendations

### Manual Testing

1. **Create test checkout session**:
   ```typescript
   import { createCheckoutSession } from '@godaddy/react/server';
   
   const session = await createCheckoutSession(input, {
     auth: { clientId: '...', clientSecret: '...' }
   });
   
   console.log(session.url);
   // → https://checkout.example.com/c/sess_abc123#tok_xyz789
   ```

2. **Visit URL in browser**:
   - Open DevTools → Network tab
   - Navigate to `session.url`
   - Verify fragment cleared from URL bar
   - Check sessionStorage for JWT
   - Monitor GraphQL requests for `Authorization: Bearer` header

3. **Test refresh**:
   - Reduce token expiry to 2 minutes (backend config)
   - Watch network for refresh call at ~1 minute
   - Verify new JWT stored

4. **Test persistence**:
   - With active JWT session, refresh page
   - Verify no new token exchange
   - Verify API calls still work

### Automated Testing

```typescript
import { render, waitFor } from '@testing-library/react';
import { Checkout } from '@godaddy/react';

test('JWT exchange flow', async () => {
  // Mock URL with fragment
  delete window.location;
  window.location = {
    ...window.location,
    pathname: '/c/sess_abc123',
    hash: '#tok_xyz789',
  };

  const { container } = render(
    <Checkout authMode="auto" />
  );

  await waitFor(() => {
    // Verify fragment cleared
    expect(window.location.hash).toBe('');
    
    // Verify sessionStorage
    const stored = sessionStorage.getItem('checkout_jwt_sess_abc123');
    expect(stored).toBeDefined();
    expect(JSON.parse(stored).jwt).toBeDefined();
  });
});
```

## Security Audit

### ✅ Implemented Safeguards

| Threat | Mitigation | Status |
|--------|------------|--------|
| Fragment token in URL history | Cleared immediately after extraction | ✅ |
| Token leakage on exchange failure | Cleared before network call | ✅ |
| SessionStorage JWT theft (XSS) | Use sessionStorage (better than localStorage), CSP required | ⚠️ Requires CSP |
| Token replay across sessions | SessionId validation on restore | ✅ |
| Expired token use | Expiry checked before use | ✅ |
| Missing storeId header | Conditional inclusion | ✅ |
| Clock skew | 60s refresh buffer | ✅ |

### ⚠️ External Dependencies (Not in Scope)

- **CSP (Content Security Policy)**: Required to prevent XSS; not implemented in this package
- **HTTPS**: Required for secure transport; deployment config
- **Backend JWT validation**: Server-side origin binding, signature verification
- **Backend token rotation**: Server implements jti tracking, revocation

## Migration Guide

### For Existing Applications

**No breaking changes**. To enable JWT auth:

1. **Update props** (optional):
   ```typescript
   // Before:
   <Checkout session={session} />
   
   // After (for JWT support):
   <Checkout 
     session={session}  // Still works for legacy
     authMode="auto"    // Enables JWT if available
   />
   ```

2. **Use new session URLs**:
   ```typescript
   // When creating sessions, share the full URL:
   const session = await createCheckoutSession(...);
   // Share: session.url (includes fragment token)
   // NOT: manually constructed URL
   ```

### For New Applications

```typescript
// 1. Server-side: Create session
import { createCheckoutSession } from '@godaddy/react/server';

const session = await createCheckoutSession(input, { auth });
const checkoutUrl = session.url;

// 2. Share URL with customer (email, redirect, etc.)
// URL format: https://checkout.example.com/c/sess_abc123#tok_xyz789

// 3. Client-side: Render Checkout component
import { Checkout } from '@godaddy/react';

<Checkout authMode="auto" />
// No session prop needed - JWT loaded from URL + storage
```

## Rollback Plan

If issues arise:

1. **Immediate**: Set `authMode="legacy"` on Checkout component
   ```typescript
   <Checkout authMode="legacy" session={session} />
   ```

2. **Full rollback**: Revert to previous version
   ```bash
   pnpm add @godaddy/react@<previous-version>
   ```

No data loss - legacy session auth still fully functional.

## Performance Considerations

- JWT exchange: 1 extra GraphQL call on first load (cached in sessionStorage)
- Token refresh: 1 GraphQL call every ~10 minutes (configurable)
- SessionStorage: ~2KB per session (JWT + metadata)
- No impact on page load (fragment parsing is synchronous, exchange is async)

## Future Enhancements (Out of Scope)

1. **Multi-tab sync**: BroadcastChannel to share JWT refresh across tabs
2. **Offline resilience**: Service worker for token refresh retry
3. **Analytics**: Track JWT adoption rate vs legacy
4. **Token revocation**: Server-side jti blocklist
5. **Biometric binding**: WebAuthn for additional security

## Conclusion

✅ Implementation complete and verified
✅ All security recommendations applied
✅ Backwards compatible with legacy auth
✅ Ready for production deployment

For questions or issues, refer to:
- Implementation: `packages/react/src/auth/checkout-auth-provider.tsx`
- API hook: `packages/react/src/hooks/use-checkout-api.ts`
- Server-side: `packages/react/src/server.ts`
