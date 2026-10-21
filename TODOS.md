# Engineering follow-ups

- [ ] Make initial theme selection work with the configured `script-src 'self'`
      policy; add a regression check.
- [ ] Bound the proxy rate limiter's tracked-client map and test capacity and
      expiry behavior.
- [ ] Review proxy hardening for remote deployment: access control, API-key input
      validation, health-response disclosure, and wildcard-CORS warnings. Verify
      exploitability and compatibility before changing behavior.
- [ ] Review the bookmarklet's direct `javascript:` link assignment and provide a
      supported installation path without bypassing React's URL handling.
- [ ] Document that browser-entered API keys use session storage and clear when
      the tab closes.
- [ ] Preserve useful export filenames when a flow title contains no ASCII
      letters or digits; test a non-ASCII-only title.
- [ ] Add synthetic editor fixtures and regression coverage spanning capture,
      parsing, graph dependencies, exports, and diffs.
