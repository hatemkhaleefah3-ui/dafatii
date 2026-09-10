# Backend integration boundary

Dafatii's UI is intentionally independent of any backend framework or API shape. UI modules read and write through `window.DafatiiData`; `data-client.js` owns the browser cache and an optional remote adapter owns transport, authentication, retries, and server-specific DTO mapping.

## Runtime model

- Reads and edits remain synchronous and local-first, so the interface works while the network is slow or unavailable.
- A connected adapter receives every later synced-data write through `save(record)`.
- `load({ localRecords })` can reconcile existing browser data with server data and return the records that should hydrate the UI.
- Server hydration never overwrites a key with an unsent local write from the current session.
- `dafatii:theme` and `dafatii:direction` are device preferences and are intentionally not synchronized.
- The adapter is the policy boundary for authorization, validation, conflict resolution, retry/backoff, idempotency, and API-version translation.

This keeps UI markup, styles, navigation, and component behavior editable without changing backend code. Backend migrations only require updating the adapter as long as the record contract remains stable.

## Adapter contract

```js
const adapter = {
  async load({ localRecords }) {
    // Reconcile/migrate localRecords on the server if required.
    // Return an array, or { records: [...] }.
    return {
      records: [
        { key: 'dafatii:subjects', format: 'json', value: [], updatedAt: 1789000000000 },
        { key: 'dafatii:joined', format: 'string', value: '1', updatedAt: 1789000000000 }
      ]
    };
  },

  async save(record) {
    // record = { key, format, value, updatedAt };
    // deleted records also contain deleted: true.
  }
};

window.DafatiiData.connect(adapter).catch(error => {
  // The local UI remains usable. Report the error to observability here.
  console.error('Backend synchronization unavailable', error);
});
```

Load the backend adapter after `data-client.js` and before the feature scripts. Do not put tokens or secrets in client code; prefer secure, HttpOnly, SameSite cookies. Validate permissions and payloads on the server even if the UI already validates them.

## Conflict and reliability requirements

The generic client does not guess at cross-device conflict policy. The backend adapter should:

1. Give each authenticated user an isolated namespace.
2. Make saves idempotent (for example, by accepting a mutation ID or a monotonically increasing version).
3. Reject stale writes with an explicit conflict response rather than silently overwriting newer data.
4. Reconcile `localRecords` during first sign-in/import and return the authoritative records.
5. Retry transient failures with bounded exponential backoff and jitter; never retry authorization or validation failures.
6. Enforce request-size limits. Chat media should move to object storage and only durable metadata/URLs should use this record channel.
7. Emit structured telemetry for load latency, save latency, failed writes, conflicts, and pending mutations.

## Verification

Run `npm test`. The test uses only Node built-ins and verifies local reads/writes, device-only exclusions, remote hydration, event dispatch, and adapter saves.
