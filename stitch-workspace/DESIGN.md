# Design System: Monochrome Messaging App

**Project ID:** 14149387514067504695

## 1. Visual Theme & Atmosphere

An ultra-modern, high-contrast monochrome aesthetic. The mood is stark, minimalist, and highly rounded, with a heavy emphasis on white space and solid black elements. It feels premium and extremely clean.

## 2. Color Palette & Roles

- Stark White (#FFFFFF) - Core backgrounds, text inside solid black bubbles/buttons
- Solid Black (#000000) - Primary elements, floating action buttons, user message bubbles, text on white backgrounds
- Light Gray (#F3F4F6) - Search bars, input pills, subtle off-white conversational backgrounds
- Medium Gray (#9CA3AF) - Secondary text, timestamps, placeholders

## 3. Typography Rules

- Font: Plus Jakarta Sans (or clean sans-serif)
- Headers: Bold, stark black text
- Body/Messages: Medium or Regular weight for legibility

## 4. Component Stylings

- **Buttons & Badges:** Fully rounded "pill-shaped" (`rounded-full`). Solid black with white icons/text for primary actions.
- **Cards/Bubbles:** Generously rounded pill shapes. Contact messages have a very soft, light shadow. User messages are solid black.
- **Inputs/Search:** Light gray pill-shaped containers with no visible border stroke.
- **Avatars:** Perfect circles (`rounded-full`).

## 5. Layout Principles

- Abundant whitespace and airy padding.
- Floating navigation bars rather than traditional edge-to-edge bottom tabs.
- Overall emphasis on extreme border-radii (`rounded-full`) for all interactive elements.

## 6. Design System Notes for Stitch Generation

**DESIGN SYSTEM (REQUIRED):**

- **Palette**: Strictly stark white, solid blacks, and light grays.
- **Geometry**: Extreme border-radii (fully rounded pills) on all components.
- **Typography**: Clean, bold sans-serif.
- **Elements**: Use solid black pill shapes for primary actions/messages, and light gray pill shapes for inputs/search bars. No sharp corners. Floating components preferred over full-width bars.
