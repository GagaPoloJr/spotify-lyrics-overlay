# PKCE (Proof Key for Code Exchange) - Explained

## What is PKCE?

PKCE is an extension to OAuth 2.0 designed specifically for **public clients** (desktop apps, mobile apps, SPA) that **cannot store secrets securely**.

### The Problem with Traditional OAuth

```
┌─────────────────────────────────────────────────────────────┐
│                   TRADITIONAL OAUTH                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Client Secret must be stored in the app                   │
│                                                             │
│   Desktop App → Can be decompiled, reverse engineered       │
│   Mobile App  → Can be decompiled from APK/IPA              │
│   SPA         → Can be viewed in browser DevTools           │
│                                                             │
│   ❌ Client Secret = insecure for public clients            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### The Solution: PKCE

```
┌─────────────────────────────────────────────────────────────┐
│                       PKCE FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   No Client Secret needed                                   │
│   Uses a pair: code_verifier + code_challenge               │
│                                                             │
│   code_verifier  = random secret (stored in app)            │
│   code_challenge = SHA256(verifier) (sent to server)        │
│                                                             │
│   ✅ Secure because SHA256 cannot be reversed               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## PKCE Components

### 1. Code Verifier

```typescript
// Random string, 32 bytes, base64url encoded
// Example: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}
```

**Characteristics:**
- Length: 43-128 characters
- Characters: `[A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"`
- **Secret** - only sent during token exchange
- Generated **new each time** you login

### 2. Code Challenge

```typescript
// SHA256 hash of code_verifier, base64url encoded
// Example: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM" → "qjrzSW9gMiUgpUvqgEPE4_-8swvyCtfOVvg55o5S_es"

function generateCodeChallenge(verifier: string): string {
  const data = new TextEncoder().encode(verifier);
  const digest = crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}
```

**Characteristics:**
- Hash of code_verifier
- **Public** - can be sent in URL
- **Cannot be reversed** to original verifier

### 3. Base64URL Encoding

```typescript
function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')  // + → -
    .replace(/\//g, '_')  // / → _
    .replace(/=+$/, '');  // remove padding =
}
```

**Why base64url?**
- URL safe (no special characters)
- Standard RFC 4648

---

## Detailed Flow

### Step-by-Step

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PKCE FLOW DETAIL                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────┐                                    ┌─────────────┐         │
│  │   APP   │                                    │   SPOTIFY   │         │
│  └────┬────┘                                    └──────┬──────┘         │
│       │                                                │                │
│       │  1. Generate Code Verifier                     │                │
│       │  ┌─────────────────────────────┐               │                │
│       │  │ verifier = "xYz123AbC..."   │               │                │
│       │  │ (32 random bytes)           │               │                │
│       │  └─────────────────────────────┘               │                │
│       │                                                │                │
│       │  2. Generate Code Challenge                    │                │
│       │  ┌─────────────────────────────┐               │                │
│       │  │ challenge = SHA256(verifier)│               │                │
│       │  │ = "aBcDeFgHiJkLmNoPqRs..."  │               │                │
│       │  └─────────────────────────────┘               │                │
│       │                                                │                │
│       │  3. Save verifier in localStorage              │                │
│       │  ┌─────────────────────────────┐               │                │
│       │  │ localStorage                │               │                │
│       │  │   .setItem('pkce_verifier', │               │                │
│       │  │     verifier)               │               │                │
│       │  └─────────────────────────────┘               │                │
│       │                                                │                │
│       │  4. Open Auth URL                              │                │
│       │  ─────────────────────────────────────────────>│                │
│       │  GET /authorize?                               │                │
│       │    client_id=xxx                               │                │
│       │    &response_type=code                         │                │
│       │    &code_challenge=aBcDeFgHiJkLmNoPqRs...      │                │
│       │    &code_challenge_method=S256                 │                │
│       │    &scope=user-read-currently-playing          │                │
│       │    &redirect_uri=http://127.0.0.1:1421/callback│                │
│       │                                                │                │
│       │                          5. User Login         │                │
│       │                          ┌───────────────┐     │                │
│       │                          │  ┌─────────┐  │     │                │
│       │                          │  │ Login   │  │     │                │
│       │                          │  │ Form    │  │     │                │
│       │                          │  └─────────┘  │     │                │
│       │                          │  ┌─────────┐  │     │                │
│       │                          │  │ [Allow] │  │     │                │
│       │                          │  └─────────┘  │     │                │
│       │                          └───────────────┘     │                │
│       │                                                │                │
│       │  6. Redirect with Auth Code                    │                │
│       │  <─────────────────────────────────────────────│                │
│       │  http://127.0.0.1:1421/callback?code=AUTH_123  │                │
│       │                                                │                │
│       │  7. Local server captures code                 │                │
│       │  ┌─────────────────────────────┐               │                │
│       │  │ tiny_http server            │               │                │
│       │  │ port 1421                   │               │                │
│       │  │ emit("oauth-callback", code)│               │                │
│       │  └─────────────────────────────┘               │                │
│       │                                                │                │
│       │  8. Exchange Code + Verifier                   │                │
│       │  ─────────────────────────────────────────────>│                │
│       │  POST /token                                   │                │
│       │    grant_type=authorization_code               │                │
│       │    &code=AUTH_CODE_123                         │                │
│       │    &code_verifier=xYz123AbC...    ← SECRET!    │                │
│       │    &client_id=xxx                               │                │
│       │    &redirect_uri=http://127.0.0.1:1421/callback│                │
│       │                                                │                │
│       │                          9. Verify             │                │
│       │                          ┌───────────────┐     │                │
│       │                          │ Spotify:      │     │                │
│       │                          │               │     │                │
│       │                          │ stored =      │     │                │
│       │                          │   challenge   │     │                │
│       │                          │   (step 4)    │     │                │
│       │                          │               │     │                │
│       │                          │ received =    │     │                │
│       │                          │   SHA256(     │     │                │
│       │                          │    verifier)  │     │                │
│       │                          │               │     │                │
│       │                          │ stored ==     │     │                │
│       │                          │ received ?    │     │                │
│       │                          │               │     │                │
│       │                          │ ✅ MATCH!     │     │                │
│       │                          └───────────────┘     │                │
│       │                                                │                │
│       │  10. Return Tokens                             │                │
│       │  <─────────────────────────────────────────────│                │
│       │  {                                             │                │
│       │    "access_token": "BQ...",    (1 hour)        │                │
│       │    "refresh_token": "AQ...",   (permanent)     │                │
│       │    "expires_in": 3600                           │                │
│       │    "token_type": "Bearer"                      │                │
│       │  }                                             │                │
│       │                                                │                │
│       │  11. Save Tokens                               │                │
│       │  ┌─────────────────────────────┐               │                │
│       │  │ Tauri Store                 │               │                │
│       │  │   access_token: "BQ..."     │               │                │
│       │  │   refresh_token: "AQ..."    │               │                │
│       │  │   expires_at: 1735689600    │               │                │
│       │  └─────────────────────────────┘               │                │
│       │                                                │                │
└───────┴────────────────────────────────────────────────┴────────────────┘
```

---

## Why is it Secure?

### Scenario: Man-in-the-Middle (MITM) Attack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ATTACK SCENARIO: TRADITIONAL OAUTH                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   APP ──────────────────────────────────────────────── SPOTIFY          │
│          ↑                                                        ↑     │
│          │              ┌─────────┐                               │     │
│          └──────────────│ ATTACKER│───────────────────────────────┘     │
│                         └─────────┘                                     │
│                                                                         │
│   Attacker intercepts:                                                  │
│   1. client_id = "xxx"                                                  │
│   2. client_secret = "s3cr3t"    ← CAN USE DIRECTLY!                   │
│   3. auth_code = "AUTH_123"                                             │
│                                                                         │
│   Attacker can:                                                         │
│   POST /token                                                           │
│     client_id = "xxx"                                                   │
│     client_secret = "s3cr3t"    ← has from intercept                   │
│     code = "AUTH_123"           ← has from intercept                   │
│                                                                         │
│   ✅ Token stolen!                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       ATTACK SCENARIO: PKCE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   APP ──────────────────────────────────────────────── SPOTIFY          │
│          ↑                                                        ↑     │
│          │              ┌─────────┐                               │     │
│          └──────────────│ ATTACKER│───────────────────────────────┘     │
│                         └─────────┘                                     │
│                                                                         │
│   Attacker intercepts:                                                  │
│   1. client_id = "xxx"                                                  │
│   2. code_challenge = "aBcDeFgHiJkLmNoPqRs..."  ← HASH, not secret!   │
│   3. auth_code = "AUTH_123"                                             │
│                                                                         │
│   Attacker tries to exchange:                                           │
│   POST /token                                                           │
│     client_id = "xxx"                                                   │
│     code = "AUTH_123"                                                   │
│     code_verifier = ???        ← DON'T KNOW!                           │
│                                                                         │
│   ❌ Failed! Cannot reverse SHA256                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why SHA256 Cannot Be Reversed?

```
SHA256 is a ONE-WAY FUNCTION:

Forward (easy):
  "hello" → "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
  Time: 0.000001 seconds

Reverse (impossible):
  "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824" → ???
  Time: ~millions of years (brute force all possibilities)

Mathematical proof:
  Input space:  256 bit = 2^256 possibilities
  Output space: 256 bit = 2^256 possibilities
  
  Many inputs → one output (collisions exist)
  But one output → many possible inputs (cannot know which one)
```

---

## Implementation in This Project

### Frontend (src/utils/pkce.ts)

```typescript
// 1. Generate random verifier
export async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);  // 32 bytes = 256 bits
  crypto.getRandomValues(array);     // Cryptographically secure random
  return base64UrlEncode(array);     // URL-safe encoding
}

// 2. Generate challenge from verifier
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);          // Convert string → bytes
  const digest = await crypto.subtle.digest('SHA-256', data);  // Hash
  return base64UrlEncode(new Uint8Array(digest)); // URL-safe encoding
}

// 3. Base64URL encoding (different from regular base64)
function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')  // + → -
    .replace(/\//g, '_')  // / → _
    .replace(/=+$/, '');  // remove padding
}
```

### Backend (src-tauri/src/spotify.rs)

```rust
// 1. Generate auth URL with challenge
#[tauri::command]
pub fn spotify_login(code_challenge: String) -> String {
    format!(
        "https://accounts.spotify.com/authorize?\
         client_id={}&\
         response_type=code&\
         redirect_uri={}&\
         code_challenge_method=S256&\  // ← tell server we use SHA256
         code_challenge={}&\           // ← challenge sent in URL
         scope=user-read-currently-playing",
        CLIENT_ID, REDIRECT_URI, code_challenge
    )
}

// 2. Exchange code + verifier for tokens
#[tauri::command]
pub async fn exchange_token(
    code: String, 
    code_verifier: String  // ← verifier sent in POST body (secure)
) -> Result<StoredTokens, String> {
    let params = [
        ("grant_type", "authorization_code"),
        ("code", &code),
        ("code_verifier", &code_verifier),  // ← Spotify verify: SHA256(verifier) === challenge?
        ("client_id", &CLIENT_ID),
        ("redirect_uri", &REDIRECT_URI),
    ];
    
    // Spotify handles verification server-side
    // If match → return tokens
    // If no match → return error
}
```

---

## Summary

| Component | Visibility | When Sent | Purpose |
|-----------|------------|-----------|---------|
| `code_verifier` | Secret | During token exchange (step 8) | Proof of ownership |
| `code_challenge` | Public | During auth request (step 4) | Server verification |
| `auth_code` | Temporary | During redirect (step 6) | Authorization grant |
| `access_token` | Secret | After exchange (step 10) | Spotify API access |

### PKCE Security

```
✅ No client_secret needed in app
✅ code_verifier is new each login
✅ code_challenge cannot be reversed
✅ Auth code useless without code_verifier
✅ Attacker cannot get token even if intercepts everything except verifier
```

---

## References

- [RFC 7636 - Proof Key for Code Exchange](https://datatracker.ietf.org/doc/html/rfc7636)
- [Spotify OAuth 2.0 Guide](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
- [OAuth 2.0 for Native Apps (RFC 8252)](https://datatracker.ietf.org/doc/html/rfc8252)

---

*Created for: spotify-lyrics-overlay project*
*Last updated: 2026-05-29*
