# Backend integration boundary

Dafatii's UI remains intentionally independent of backend framework, database schema, and object-storage provider. Visual modules read/write structured application state through `window.DafatiiData`; `backend-adapter.js` owns remote transport and synchronization. Authentication is exposed by `window.DafatiiAuth`; binary files are exposed by `window.DafatiiFiles`. UI modules must not call `/api/*`, D1, GCS, IAM, or storage object paths directly.

## Production architecture

```text
GitHub main
   │
   ▼
Cloudflare Pages ─────────────── static HTML/CSS/JS
   │
   └─ /functions/api/v1/* ───── Pages Functions
                │        │
                │        └───── private Google Cloud Storage (binary objects)
                ▼
             D1 DB (users, sessions, records, file metadata)
```

Large file data does not transit the Function. The Function authorizes the operation and creates a short-lived capability; the browser transfers bytes directly to/from GCS.

## Runtime contracts

`DafatiiData` remains the local-first structured-data contract. Reads/edits are synchronous against browser state. `backend-adapter.js` implements `load()`/`save()`, tracks server revisions, generates mutation IDs, retries only transient HTTP classes with bounded exponential backoff and jitter, and surfaces 409 conflicts as `dafatii:syncconflict`. Device-only `dafatii:theme` and `dafatii:direction` are not synchronized.

`DafatiiAuth` exposes `signup(details)`, `login(details)`, `current()`, and `logout()`. Authentication uses a server-issued `__Host-dafatii_session` HttpOnly, Secure, SameSite=Strict cookie. Browser values including `dafatii:joined` are UI state only and confer no API authority.

`DafatiiFiles` exposes `upload(file, options)`, `get(fileId)`, `getView(fileId)`, `getViewUrl(fileId)`, and `delete(fileId)`. UI code stores internal `fileId` values only. Bucket names, object paths, signing credentials, and signed-URL details remain backend-private.

## Authentication and authorization

Passwords are PBKDF2-HMAC-SHA-256 with a per-user 128-bit random salt and 600,000 iterations, using Workers Web Crypto. Passwords are never stored or logged. Session tokens contain 256 random bits; only SHA-256 hashes are stored in D1. Sessions expire after 30 days and are deleted on logout. Invalid/expired sessions return 401. Authentication attempts are rate-limited in 15-minute D1 buckets. Account lookup failures use a common invalid-credentials response.

Every data/file query derives `user_id` from the validated session. Client-submitted ownership is ignored. File lookup uses `(fileId, authenticated userId)` to prevent IDOR. State-changing requests reject disallowed `Origin` values. `SameSite=Strict` is an additional CSRF control.

## D1 schema and migrations

`migrations/0001_backend.sql` creates `users`, `sessions`, `login_attempts`, `records`, and `files`, including foreign keys, unique constraints, ownership columns, indexes, revisions, mutation IDs, and file lifecycle state. Apply migrations in order; never edit an already-applied production migration—add a new numbered migration.

Structured records use `(user_id, record_key)` as the primary key. Mutations carry an expected revision and mutation ID. A stale expected revision returns `409 revision_conflict`; a repeated mutation ID is idempotent. This prevents silent last-writer-wins overwrites.

### Existing local data

Signup performs a one-time merge-missing import of the browser's existing `DafatiiData.localSnapshot()` before remote hydration. Import never overwrites an existing server key. Login does not automatically import local browser data, which avoids accidentally importing another person's local state on a shared device. A future account UI can explicitly call `DafatiiDataRemote.importLocal(records)` after user confirmation. Local data is not erased by import.

## File lifecycle and API

API responses use `{error:{code,message,requestId}}` on failure.

- `POST /api/v1/files/upload-init`: authenticate; validate size/MIME policy; generate `fileId` and `users/{userId}/{fileId}/object`; insert `pending`; return a 10-minute V4 signed PUT URL with signed `Content-Type` and `x-goog-meta-dafatii-file-id` headers.
- `POST /api/v1/files/{fileId}/complete`: HEAD the exact server-owned object; verify size, MIME, and signed file-ID metadata; atomically transition pending → available. Repeated completion of an available file is safe.
- `GET /api/v1/files/{fileId}`: return authorized metadata only.
- `GET /api/v1/files/{fileId}/view`: authorize and return a 10-minute signed GET URL. Signed URLs are never persisted or logged.
- `DELETE /api/v1/files/{fileId}`: mark `delete_pending`, delete the exact GCS object, then mark deleted. A failed object deletion remains recoverable as `delete_pending`.

Upload policy defaults to 512 MiB and rejects active web content (`text/html`, XHTML, JavaScript, SVG) plus unknown MIME types. Filenames are display metadata only, normalized and stripped of control/path characters. Object keys are server-generated. Extension alone is never used for authorization. The `quarantined` state is reserved as the malware-scanning hook; production can insert scanning between pending and available without changing `DafatiiFiles`.

## GCS V4 signing

`functions/_lib/gcs.js` implements Google Cloud Storage V4 XML-API signing using Workers Web Crypto (`RSASSA-PKCS1-v1_5` + SHA-256). Canonical path segments and query values use RFC3986 percent encoding; query parameters are lexicographically sorted; signed headers are normalized/sorted. Signed capability lifetime is hard-bounded to 900 seconds; current upload/view routes request 600 seconds.

The implementation follows Google's V4 canonical-request/string-to-sign process. Do not replace it with a Node-only Google SDK inside Pages Functions without verifying Workers compatibility.

## GCS bucket setup

Create a dedicated bucket for Dafatii uploads. Keep it private. Enable Public Access Prevention and uniform bucket-level access. Grant the signing service account only the object permissions needed by this implementation (create/read/delete objects in this bucket); do not grant project Owner/Editor. Do not grant public principals.

Recommended CORS configuration for the XML API:

```json
[
  {
    "origin": ["https://YOUR_PRODUCTION_ORIGIN", "http://localhost:8788"],
    "method": ["GET", "HEAD", "PUT"],
    "responseHeader": ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges", "x-goog-meta-dafatii-file-id"],
    "maxAgeSeconds": 3600
  }
]
```

Add only preview origins you actually use. Do not use `*` with private application origins. Cloudflare preview hostnames are numerous; for production security, prefer a controlled preview hostname/custom domain rather than broad wildcard trust. GCS XML API CORS is what governs direct signed browser requests. Range requests are not signed headers and remain usable by PDF.js and native audio/video controls.

Use a lifecycle rule to remove objects under pending-upload prefixes only if your operational cleanup process can also reconcile D1. Do not blindly delete all old objects: available objects share the same prefix structure. A scheduled reconciliation job can later delete GCS objects whose D1 row has remained `pending` beyond the chosen retention window.

## Cloudflare configuration

Pages Functions live under root `/functions`; Cloudflare generates routes from this directory. Bind the production D1 database as `DB`. `wrangler.example.jsonc` is deliberately non-active because an incomplete Wrangler file must not accidentally become the Pages project's source of truth. Cloudflare recommends downloading the existing Pages configuration before opting into Wrangler-managed configuration.

Encrypted secrets/environment values required by Functions:

```text
GCS_BUCKET
GCS_CLIENT_EMAIL
GCS_PRIVATE_KEY
APP_ORIGINS
MAX_UPLOAD_BYTES (optional; default 536870912)
```

`GCS_PROJECT_ID` is documented for operations/configuration but the local RSA V4 signer does not need it at runtime. Never expose these values in browser JS. `.env`, `.dev.vars`, service-account JSON, PEM/key files, and Wrangler local state are gitignored.

## Local development

1. Install a current Wrangler version compatible with Pages Functions.
2. Download/verify the actual Pages project configuration, or pass the D1 binding explicitly to `wrangler pages dev`.
3. Create a local `.dev.vars` from `.env.example` with development-only credentials.
4. Apply `migrations/0001_backend.sql` to the local D1 database.
5. Run Pages locally (normally `npx wrangler pages dev . --d1 DB=<DATABASE_ID>` when not using an active Wrangler config).
6. Ensure the development origin is present in both `APP_ORIGINS` and GCS CORS.
7. Run `npm test`.

## PDF and media

`pdf-viewer.js` uses Mozilla PDF.js 6.3.289's display layer and obtains the source URL only through `DafatiiFiles`. It provides page navigation, page count, zoom, responsive fit, fullscreen, loading, and error states. Images, audio, and video use native browser elements with authorized signed URLs. Other files open through an authorized URL. The material integration is isolated in `material-files.js`; the core subject/lecture rendering does not know GCS details.

## Reliability and recovery

Interrupted upload: D1 remains `pending`; retry from a fresh upload-init rather than reusing an expired URL. Expired signed URL: request a new view URL; never cache it durably. Duplicate completion: returns success for `available`. Missing/mismatched GCS object: completion stays pending. Deletion failure: row remains `delete_pending` and can be retried operationally. D1/GCS transient errors return structured failures; the structured-data adapter retries only transient HTTP statuses. Auth/validation/conflict errors are not automatically retried.

Observability logs JSON events for authentication failures, upload initialization/completion, sync conflicts, API failures, and deletion failures. Do not add raw cookies, passwords, private keys, or complete signed URLs to logs.

## Deployment and rollback

Production remains GitHub `main` → Cloudflare Pages. Merge the backend PR only after D1/GCS bindings and secrets are ready. Apply forward-compatible D1 migrations before enabling routes that require them. For rollback, redeploy the previous Pages commit; do not reverse destructive schema changes. Schema changes should be additive whenever possible. File metadata and objects remain durable across frontend rollback.

## Backup/restore and cost

D1 contains authoritative account/relationship/file metadata; establish scheduled D1 export/backup appropriate to the account tier and test restoration into a separate database. GCS should use an appropriate retention/versioning/backup policy based on desired recovery point and storage cost. Restoring D1 without corresponding GCS objects can create stale file rows; restoring GCS without D1 can create orphans, so reconciliation tooling should compare `files.object_key` to bucket inventory.

Primary cost drivers are D1 reads/writes, Function invocations, GCS stored bytes, GCS operations, and GCS network egress. Large object bytes bypass Pages Functions. Do not assume any free-tier allowance is permanent.

## Verification and invariants

Run `npm test` plus syntax checks before deployment. Security-sensitive invariants include: unauthenticated requests return 401; session identity is the only ownership source; user A cannot address user B's rows/files; object keys are generated server-side; completion verifies authoritative GCS metadata; signed URL expiry is bounded; stale structured-data writes conflict; duplicate mutation/completion is idempotent; and no secret appears in static browser output.
