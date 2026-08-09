# Supportable Chrome Extension

Manifest V3 prototype for capturing a support request from the current browser tab.

## Current prototype

- Captures current page title and URL.
- Attempts to capture selected text.
- Collects request description and request type.
- Stores the request locally as `pendingSupportRequest`.
- Provides an API endpoint setting for the next integration step.

## Load locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `extension/` directory.
5. Pin Supportable and open it on a normal web page.

No Chrome Web Store publication is required for development.

## Next step

Connect `popup.js` to the Supportable request API using the configured endpoint. Authentication should use the existing Supportable participant/session model rather than putting credentials in the extension source.
