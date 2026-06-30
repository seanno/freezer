# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

"The Freezer" is an Azure Static Web App for personal cold storage. Users upload large files that land in Azure Blob Storage at the **Archive access tier** (cheap to store, expensive/slow to retrieve). Retrieving ("thawing") a file takes ~15 hours. More context: https://shutdownhook.com/2022/02/14/cold-storage-on-azure/

## Build

```bash
# Install root deps (webpack for bundling @azure/storage-blob for the browser)
npm install

# Build the browser-side Azure SDK bundle → src/azure-storage-blob.js
npm run build

# Install API deps separately
cd api && npm install
```

The webpack bundle (`src/azure-storage-blob.js`) must be rebuilt any time the root `package.json` dependencies change. It is committed to the repo.

## Local Development

```bash
# Run the Azure Functions API locally (from api/)
cd api && npm run start   # calls: func start
```

For full local development including the static frontend and auth emulation, use the Azure Static Web Apps CLI (`swa start`), which is not currently in `package.json` but can be installed globally.

## Architecture

```
src/index.html          ← entire frontend (single HTML file, inline JS, jQuery)
src/azure-storage-blob.js ← webpack bundle of @azure/storage-blob for browser use
src/staticwebapp.config.json ← routing + auth rules for Azure SWA
api/                    ← Azure Functions v2 backend
  shared/freezer.js     ← Freezer class: all Azure Blob Storage logic
  shared/user.js        ← User class: decodes x-ms-client-principal header
  getUploadBlobUrl/     ← returns SAS URL; browser uploads directly to Azure
  downloadBlob/         ← 302 redirect to a SAS URL with content-disposition
  listFiles/            ← returns { archive: [...], active: [...] } blobs
  deleteFile/           ← deletes blob + snapshots
  thawFile/             ← copies archive blob to Cool tier via raw REST
  misc/                 ← returns { container, acct } for UI display
  getContainerName/     ← returns container name
```

## Key Design Decisions

**Per-user containers**: Each authenticated user gets their own blob container named after the local part of their email (before `@`), extracted from the `x-ms-client-principal` header injected by Azure SWA.

**Browser-direct upload**: The API generates a short-lived SAS URL (`getUploadBlobUrl`), and the browser uploads directly to Azure Blob Storage using `AzureStorageBlob.newBlockBlobClientOptions`. This avoids routing large files through the Functions runtime. Upload `concurrency` is set to 4 — Chrome limits 5 concurrent connections to the same domain, and exceeding that causes timeouts.

**Thawing via copy, not tier-flip**: Changing an Archive blob's tier directly incurs a 180-day early-deletion penalty. Instead, `thawFile` *copies* the blob to a new blob named `thawed-<original>` at the Cool tier. The Azure SDK doesn't expose this cross-tier copy, so `thawFile` manually constructs and HMAC-SHA256-signs a raw Azure REST API `PUT` (Copy Blob) request using `crypto-js`.

**Auth**: Azure Static Web Apps built-in auth with Azure AD. All routes except `/.auth/*` require the `contributor` role. Role assignment is managed in the Azure portal. Unauthenticated users get a 401 → 302 redirect to AAD login.

## Gotchas

- **`crypto-js` must appear in both `package.json` files** (root and `api/`). The Azure SWA Oryx build system deploys the `api/` folder independently and will not find packages listed only in the root.
- **CORS on the storage account**: The Azure storage account needs a CORS rule allowing requests from the SWA domain (visible in the SWA overview URL). Without this, browser-direct uploads fail.
- **Local emulator diverges from production**: The local Functions emulator doesn't fully replicate the SWA auth/routing environment. Prefer deploying a staging slot for auth-related changes.

## Required Environment Variables (Azure Functions)

| Variable | Description |
|---|---|
| `STORAGE_ACCT` | Azure storage account name |
| `STORAGE_KEY` | Azure storage account key |

In production these are set in the Azure Static Web App's application settings. For local `func start`, create `api/local.settings.json`.

## Deployment

Pushing to `master` automatically deploys via GitHub Actions (`.github/workflows/`), which runs `Azure/static-web-apps-deploy`. The `app_location` is `/src` (static files served as-is, no build step in CI) and `api_location` is `api`.
