# KisserShare - File Transfer Utility (Cloudflare Workers + Python)

Temporary file sharing service with a Windows XP-themed UI, running on Cloudflare Workers with R2 object storage.

## Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (package manager)
- Node.js 18+ (for Wrangler CLI)
- Cloudflare account with Workers and R2 enabled

## Setup

```bash
# Install dependencies
uv sync

# Create R2 bucket
npx wrangler r2 bucket create kissershare-files

# Set your upload token as a secret
npx wrangler secret put UPLOAD_TOKEN

# Run locally
uv run pywrangler dev

# Deploy to Cloudflare
uv run pywrangler deploy
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `UPLOAD_TOKEN` | (required) | Bearer token for file uploads |
| `FILE_EXPIRY` | `300000` | File expiry in milliseconds (default: 5 minutes) |
