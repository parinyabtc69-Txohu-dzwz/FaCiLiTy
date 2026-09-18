# Google Apps Script (GAS) Authentication & Troubleshooting Guidelines

When working with Google Apps Script Web Apps (especially for Login endpoints), always adhere to the following rules to prevent common errors:

## 1. HTTP 404 on POST Requests (CORS / Redirect Issues)
If a cross-origin `fetch` POST request to a GAS Web App returns `HTTP 404` or throws a CORS error, it is almost ALWAYS a deployment permission issue.
- **Rule**: A GAS Web App receiving cross-origin API requests must ALWAYS be deployed with:
  - **Execute as**: Me
  - **Who has access**: Anyone
- **Never** use "Anyone with a Google Account" or "Only myself" for API endpoints, as it triggers a 302 redirect to `accounts.google.com/ServiceLogin`, which breaks POST requests and results in a 404 Not Found error.

## 2. Email Comparison and Database Lookups
When comparing emails (e.g., from Google Login JWT payload) against a Google Sheet database, always sanitize the inputs.
- **Rule**: ALWAYS use `.trim().toLowerCase()` on both the input email and the database email before comparison.
- **Example**: `if (inputEmail.trim().toLowerCase() === String(rowEmail).trim().toLowerCase())`
- **Reasoning**: Google sometimes returns emails in varying casing, and manual sheet entries often contain accidental whitespace. Failure to sanitize causes duplicate database entries and broken role assignments.
