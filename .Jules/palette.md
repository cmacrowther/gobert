## 2025-02-23 - Accessibility Pattern: Icon-only Buttons
**Learning:** Icon-only buttons (like Submit and Clear History) consistently lacked ARIA labels, making them invisible to screen readers.
**Action:** When adding icon-only buttons, always include `aria-label` describing the action.

## 2025-02-23 - UX Pattern: Assistant Message Tools
**Learning:** Assistant messages are plain text but users expect utility tools (Copy, Regenerate).
**Action:** Use `group` on the message container and `opacity-0 group-hover:opacity-100` on utility buttons to keep the interface clean but functional.
