# Development Guidelines

## 1. No Ephemeral Patch Files
All code modifications, feature additions, and performance optimizations (such as API caching) MUST be integrated directly into the core source files (e.g., `main.js`, `Code.gs`) immediately. 
Do NOT rely on temporary `patch_*.js` scripts to hold core logic. If patch files must be deleted during a cleanup, you MUST verify that their contents have been safely merged into the main files first.

## 2. Localhost Authentication Awareness
When developing and testing locally (`localhost:3000`), be aware that external authentication providers like LIFF (`liff.login()`) and Google OAuth will often fail or redirect to production URLs due to Callback URL and CORS configurations.
- Always provide a mock login mechanism or a specific "Dev Mode" bypass for local testing.
- Do not assume that external OAuth redirects will work seamlessly on `localhost`.
