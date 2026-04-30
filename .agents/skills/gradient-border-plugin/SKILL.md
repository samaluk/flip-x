---
name: gradient-border-plugin
description: Install, configure, use, and review gradient-border-plugin for Tailwind CSS gradient borders. Use when adding gradient borders, animated gradient borders, gradient-border classes, or when the user mentions gradient-border-plugin.
---

# Gradient Border Plugin

## Before Editing

1. Read `DESIGN.md` before changing UI.
2. Inspect the Tailwind setup first:
   - Check `package.json` for Tailwind and package manager versions.
   - Look for `tailwind.config.*`, `postcss.config.*`, `app/globals.css`, and existing `@import "tailwindcss"` or plugin setup.
   - This repo may use Tailwind 4 without a classic config file, so do not assume the Tailwind 3 config workflow applies.
3. Use existing components, design tokens, spacing, radii, color, and class composition patterns.

## Install

Use the project's package manager. In this repo, prefer:

```bash
pnpm add -D gradient-border-plugin
```

Only install the package when the project does not already provide equivalent gradient-border utilities.

## Configure

For Tailwind v4 CSS-first projects, import the plugin from the Tailwind stylesheet:

```css
@import "gradient-border-plugin";
```

Place the import near the existing Tailwind and plugin imports. Before editing, verify the current stylesheet structure and avoid duplicating imports.

## Usage

Use `gradient-border` for a 1px gradient border:

```tsx
<div className="gradient-border gradient-border-to-r gradient-border-from-blue-500 gradient-border-to-pink-300 rounded-lg" />
```

Use width variants when the border needs more presence:

```tsx
<div className="gradient-border-2 gradient-border-to-r gradient-border-from-blue-500 gradient-border-to-pink-300 rounded-lg" />
```

Add a middle stop with `gradient-border-via-*`:

```tsx
<div className="gradient-border gradient-border-to-r gradient-border-from-indigo-500 gradient-border-via-purple-500 gradient-border-to-pink-500 rounded-lg" />
```

Use `animate-gradient-border` sparingly for states that benefit from motion:

```tsx
<div className="gradient-border-2 animate-gradient-border gradient-border-from-indigo-500 gradient-border-via-purple-500 gradient-border-to-pink-500 rounded-lg" />
```

Override animation duration with `--gradient-border-duration`:

```tsx
<div className="gradient-border animate-gradient-border [--gradient-border-duration:2s]" />
```

For complex gradients, set `--gradient-border` directly:

```tsx
<div className="gradient-border [--gradient-border:conic-gradient(from_90deg,red,blue,red)]" />
```

## Class Reference

- `gradient-border`: 1px gradient border.
- `gradient-border-2`, `gradient-border-3`, `gradient-border-4`: wider gradient borders.
- `gradient-border-none`: remove the gradient border.
- `gradient-border-to-t`, `gradient-border-to-tr`, `gradient-border-to-r`, `gradient-border-to-br`, `gradient-border-to-b`, `gradient-border-to-bl`, `gradient-border-to-l`, `gradient-border-to-tl`: gradient direction.
- `gradient-border-from-{color}`, `gradient-border-via-{color}`, `gradient-border-to-{color}`: color stops.
- `animate-gradient-border`: rotates the gradient angle continuously.

Color stops accept Tailwind-style alpha modifiers:

```tsx
<div className="gradient-border gradient-border-from-blue-500/50 gradient-border-to-pink-300/20" />
```

## Theme Customization

Add custom border widths in Tailwind v4 with `@theme`:

```css
@theme {
  --gradient-border-width-5: 5px;
  --gradient-border-width-6: 6px;
}
```

Only add custom widths when the design system needs them. Prefer the built-in widths unless a component has a clear visual requirement.

## Review Checklist

- `DESIGN.md` was read before UI changes.
- Tailwind version and stylesheet setup were inspected before installation or import edits.
- The plugin is installed and imported before `gradient-border*` classes are used.
- Gradient colors come from the design system or existing Tailwind palette conventions.
- Border width and `rounded-*` classes work together visually.
- Animated borders are not used for routine decoration or distracting motion.
- Contrast remains accessible when the border communicates state, focus, or emphasis.
