---
name: fluid-tailwind
description: Install, configure, and use fluid-tailwind for responsive Tailwind utilities with CSS clamp(). Use when adding fluid responsive classes, setting up fluid-tailwind, reviewing fluid-tailwind usage, or when the user mentions fluid.tw, fluid utilities, clamp-based Tailwind sizing, or the `~` modifier.
---

# Fluid Tailwind

## Before Editing

1. Read `DESIGN.md` before changing UI.
2. Inspect the Tailwind setup first:
   - Check `package.json` for Tailwind and package manager versions.
   - Look for `tailwind.config.*`, `postcss.config.*`, `app/globals.css`, and existing `@import "tailwindcss"` or plugin setup.
   - This repo may use Tailwind 4 without a classic config file, so do not assume the Tailwind 3 config workflow applies.
3. Use existing components, design tokens, spacing, typography, and class composition patterns.

## Install

Use the project's package manager. In this repo, prefer:

```bash
pnpm add -D fluid-tailwind
```

If using `tailwind-merge` with project-specific merge helpers, consider whether `@fluid-tailwind/tailwind-merge` is also needed:

```bash
pnpm add @fluid-tailwind/tailwind-merge
```

Only add the merge plugin when the project has a central `tailwind-merge` wrapper that needs to understand fluid classes.

## Configure

For config-based Tailwind projects, the official setup is:

```js
import fluid, { extract, fontSize, screens } from "fluid-tailwind";

export default {
  content: {
    files: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
    extract,
  },
  theme: {
    screens,
    fontSize,
  },
  plugins: [fluid],
};
```

Before applying this, verify the current Tailwind version and integration path. Tailwind 4/CSS-first projects may need a different plugin registration strategy than classic `tailwind.config.js`.

Use `rem`-based `screens` and `fontSize` values when configuring fluid-tailwind. Fluid utilities require compatible length literals so `clamp()` can be generated safely.

## Usage

The `~` modifier makes a utility fluid between a start and end value:

```tsx
<button className="~px-4/8 ~py-2/4 ~text-sm/xl">Fluid button</button>
```

Common patterns:

- Use `~text-lg/2xl`, `~p-6/10`, `~gap-3/6`, `~rounded-lg/2xl`, and similar classes when a value should scale smoothly between breakpoints.
- Use normal Tailwind classes for fixed behavior and fluid classes only where smooth interpolation improves the layout.
- Keep classes aligned with `DESIGN.md`; fluid sizing does not justify inventing new visual scales.

## Breakpoints

Customize the interpolation range with the `~` variant:

```tsx
<h1 className="~md/lg:~text-base/4xl">Quick increase</h1>
<div className="~md:~text-base/4xl" />
<div className="~/lg:~text-base/4xl" />
```

Use `~min-[]` for arbitrary start breakpoints:

```tsx
<div className="~min-[20rem]/lg:~text-base/4xl" />
```

If using container queries, `~@` scales against container widths:

```tsx
<h2 className="~@md/lg:~text-base/4xl">Container-relative text</h2>
```

## Negative Values

For negative fluid utilities, put the dash after `~`:

```tsx
<div className="~-mt-3/5" />
```

## Limitations

Fluid utilities only work when start and end values are compatible length literals:

- Good: `~p-4/8`, `~text-base/2xl`
- Avoid mixed units: `~p-[1rem]/[18px]`
- Avoid non-length values: `~text-white/red-500`
- Avoid non-literal calculations: `~text-[1rem]/[calc(1.5rem-2px)]`

If a fluid utility fails, Tailwind may emit an empty CSS rule with a comment explaining why. Inspect generated CSS or browser devtools when a class appears not to work.

## Accessibility

fluid-tailwind checks fluid type against WCAG Success Criterion 1.4.4 by default. Do not disable `checkSC144` unless the user explicitly asks and the accessibility impact is understood.

## Review Checklist

- The Tailwind version and config style were inspected before setup edits.
- UI changes follow `DESIGN.md`.
- Fluid classes use design-system scale values where possible.
- Start and end values use compatible units.
- Breakpoint variants are used only where the default interpolation range is not appropriate.
- Added dependencies are necessary and installed with the project package manager.
