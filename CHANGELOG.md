# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2026-03-28

### Changed

- Rebranded from QuickSuite/QS to Quick Flow across all user-facing text
- Rewrote diff engine with keyed matching for accurate duplicate-title handling
- Extracted proxy utilities into `server/proxy-utils.ts` for cleaner separation
- Simplified component code across all phases
- Removed emoji from all UI elements, replaced with text labels
- Left-aligned content layout (was centered-everything)

### Fixed

- Diff matching now correctly handles steps with identical titles
- Removed raw HTML injection (XSS surface) in diff output
- Hardened proxy server input validation and error handling
- Rate limiter now uses remoteAddress by default (TRUST_PROXY opt-in)
- Bookmarklet uses textContent instead of document.write (XSS fix)
- Fixed .env.example VITE_ prefix that would leak API keys in build

### Added

- Input length validation on proxy request fields
- Consistent focus ring styles across paste and diff textareas

## [1.0.0] - 2026-03-27

### Added

- Initial release
- AI-powered parsing of raw Quick Flows editor content
- Support for all Quick Flows step types
- Reasoning Group instruction extraction
- Visual flow review and editing
- Markdown export (copy to clipboard and file download)
- Export history with localStorage persistence
- AI proxy server with Anthropic and AWS Bedrock support
