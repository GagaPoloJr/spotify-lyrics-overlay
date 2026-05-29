# Spotify Lyrics API - Rate Limits & Information

## 1. Spotify Internal Lyrics API (Unofficial)

**Endpoint:** `spclient.wg.spotify.com/color-lyrics/v2/track/{track_id}`

| Aspect | Details |
|--------|---------|
| **Status** | Unofficial/Internal API |
| **Rate Limits** | No documentation available |
| **Authentication** | Web Player Token (from `open.spotify.com/get_access_token`) |
| **Risk** | Could change or be blocked without notice |

### Known Behavior
```
- No documented rate limits
- Used by Spotify Web Player internally
- Web player token is different from regular access token
- Could be blocked if abused (millions of requests)
- Response: JSON with synced lyrics
```

### Risks of Using Internal API
```
⚠️ WARNING:
1. No SLA/guarantee from Spotify
2. Can change anytime (endpoint, format, auth)
3. Can be blocked if abused
4. No official support
5. ToS violation risk (grey area)
```

---

## 2. Regular Spotify Web API (Official)

**Endpoint:** `api.spotify.com/v1/*`

| Aspect | Details |
|--------|---------|
| **Status** | Official API |
| **Rate Limits** | **30 requests/second** (per app) |
| **Documentation** | [developer.spotify.com](https://developer.spotify.com) |
| **Support** | Official from Spotify |

### Rate Limit Headers
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 1640995200
```

### What Happens When Rate Limited
```
HTTP 429 Too Many Requests
Retry-After: 30 (seconds)
```

---

## 3. lrclib.net API (Fallback)

**Endpoint:** `lrclib.net/api/get`

| Aspect | Details |
|--------|---------|
| **Status** | Open Source, Free |
| **Rate Limits** | **None documented** |
| **Auth** | Not required |
| **Source** | Community-driven |

### Notes
```
- No documented rate limits
- But fair use expected
- Quality varies (depends on song)
- Synced lyrics available for popular songs
```

---

## 4. Implementation in This Project

### Current Flow (Recommended)
```
┌─────────────────────────────────────────────────────────────┐
│                   LYRICS FETCHING STRATEGY                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Try Spotify Internal API                                │
│     ├─ Pros: Best quality, synced lyrics                    │
│     ├─ Cons: Unofficial, could break                        │
│     └─ Rate: No documented limit                            │
│                                                             │
│  2. Fallback to lrclib.net                                  │
│     ├─ Pros: Free, no auth, open source                     │
│     ├─ Cons: Quality varies                                 │
│     └─ Rate: No documented limit                            │
│                                                             │
│  Polling: Every 5 seconds (reasonable, not abusive)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Best Practices
```
✅ DO:
- Cache lyrics (don't fetch again for same song)
- Poll every 5 seconds (not every second)
- Handle 429 gracefully (retry with backoff)
- Store lyrics in memory (useRef)

❌ DON'T:
- Fetch lyrics repeatedly for same song
- Poll more than once per second
- Ignore rate limit headers
- Bulk fetch lyrics for many songs
```

---

## 5. Lyrics Caching in This Project

```typescript
// Lyrics are cached via useRef in useSpotifyPolling
const lyricsCache = useRef<Map<string, SyncedLyric[]>>(new Map());

// Only fetch if track changed
if (lastTrackRef.current !== currentKey) {
  // Check cache first
  if (lyricsCache.current.has(currentKey)) {
    setLyrics(lyricsCache.current.get(currentKey)!);
  } else {
    // Fetch from API
    const lyrics = await fetchLyrics(...);
    lyricsCache.current.set(currentKey, lyrics);
    setLyrics(lyrics);
  }
}
```

---

## 6. Recommendation

| Use Case | Recommendation |
|----------|----------------|
| Personal use | ✅ Safe - polling 5s, single user |
| Small app (< 100 users) | ⚠️ Caution - add caching |
| Large app (1000+ users) | ❌ Risky - need server-side caching |
| Production app | ❌ Don't use unofficial API |

### For This Project (Personal Use)
```
✅ Safe because:
- Single user (you)
- Polling every 5 seconds (not abusive)
- Lyrics are cached (no re-fetching)
- Fallback to lrclib.net if Spotify fails
```

---

## 7. Monitoring API Health

Add logging to track API usage:

```typescript
// In services/lyrics.ts
async function fetchSpotifyLyrics(trackId: string): Promise<SyncedLyric[] | null> {
  const start = Date.now();
  
  try {
    // ... fetch logic
    const duration = Date.now() - start;
    console.log(`[API] Spotify lyrics: ${duration}ms, ${parsed.length} lines`);
    return parsed;
  } catch (error) {
    console.error(`[API] Spotify lyrics failed:`, error);
    return null;
  }
}
```

---

*Last updated: 2026-05-29*
