---
colors:
  background: "oklch(0.13 0.004 260)"
  foreground: "oklch(0.97 0.005 260)"
  card: "oklch(0.17 0.005 260)"
  card-foreground: "oklch(0.97 0.005 260)"
  popover: "oklch(0.17 0.005 260)"
  popover-foreground: "oklch(0.97 0.005 260)"
  primary: "oklch(0.72 0.14 160)"
  primary-foreground: "oklch(0.14 0.01 160)"
  secondary: "oklch(0.22 0.006 260)"
  secondary-foreground: "oklch(0.95 0.005 260)"
  muted: "oklch(0.2 0.006 260)"
  muted-foreground: "oklch(0.65 0.01 260)"
  accent: "oklch(0.24 0.008 260)"
  accent-foreground: "oklch(0.95 0.005 260)"
  destructive: "oklch(0.63 0.21 24)"
  border: "oklch(0.3 0.006 260 / 60%)"
  input: "oklch(0.25 0.006 260 / 70%)"
  ring: "oklch(0.72 0.14 160)"
  chart-1: "oklch(0.72 0.14 160)"
  chart-2: "oklch(0.65 0.01 260)"
  chart-3: "oklch(0.5 0.01 260)"
  chart-4: "oklch(0.37 0.008 260)"
  chart-5: "oklch(0.27 0.006 260)"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  two-xl: "1.125rem"
  three-xl: "1.375rem"
  four-xl: "1.625rem"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  two-xl: "32px"
typography:
  body-md:
    fontFamily: "var(--font-sans)"
    size: "1rem"
    lineHeight: "1.5"
  heading-lg:
    fontFamily: "var(--font-heading)"
    size: "1.875rem"
    lineHeight: "2.25rem"
    fontWeight: "600"
  code-sm:
    fontFamily: "var(--font-mono)"
    size: "0.875rem"
    lineHeight: "1.25rem"
---

# Flip 7

A modern, dark-tabletop UI for the Flip 7 card game

**Version**: alpha

## Overview

Flip 7 is a modern, dark-tabletop user interface for the Flip 7 card game. The design system is built on a carefully calibrated dark theme with high contrast, accessible color ratios, and a refined visual hierarchy. Runtime tokens live in `app/globals.css` (`:root` and optional `.dark`) and are exposed to Tailwind v4 through shadcn’s `@theme inline` block.

## Colors

The palette uses **oklch** in CSS for perceptually uniform transitions and accessible contrast. Token names match shadcn/Tailwind utilities (`bg-background`, `bg-card`, `text-muted-foreground`, `bg-destructive`, `ring`, `chart-1`, etc.). Values in the YAML frontmatter mirror `:root` in `app/globals.css`.

- **Primary**: Actions and highlights (`bg-primary`, `text-primary-foreground`)
- **Card / Popover**: Elevated surfaces (`bg-card`, `bg-popover`)
- **Secondary / Muted / Accent**: Hierarchy and de-emphasized UI
- **Destructive**: Errors and destructive actions (`bg-destructive`)
- **Chart 1–5**: Data visualization (`chart-1` … `chart-5` in Tailwind)
- **Border / Input / Ring**: Edges, fields, and focus (`border-border`, `ring-ring`)

A `.dark` class on an ancestor overrides several tokens for a slightly deeper background; the default `:root` theme is already dark-tabletop.

## Typography

Three core typeface families provide the typographic scale:

- **Sans**: Body text and UI labels (`font-sans`, CSS `--font-sans`)
- **Heading**: Display and section headings (`font-heading`, aliased to sans in `@theme`)
- **Mono**: Code and tabular data (`font-mono`, CSS `--font-geist-mono`)

## Layout

Spacing follows a fixed baseline scale (design reference; prefer Tailwind spacing utilities that match intent):

- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 24px
- **two-xl**: 32px

## Elevation & Depth

Two component classes in `app/globals.css` create visual separation (not separate color tokens):

- **surface-elevated**: High-contrast panel with inset light border and drop shadow
- **surface-glass**: Semi-transparent glass with backdrop blur and frosted border

## Shapes

Border radius is driven by `--radius: 0.625rem` in `:root`. Tailwind utilities `rounded-sm` … `rounded-4xl` map to multiples of that base in `@theme inline`:

- **sm**: 60% of base (0.375rem)
- **md**: 80% of base (0.5rem)
- **lg**: 100% of base (0.625rem)
- **xl**: 140% of base (0.875rem)
- **two-xl** (`rounded-2xl`): 180% of base (1.125rem)
- **three-xl** (`rounded-3xl`): 220% of base (1.375rem)
- **four-xl** (`rounded-4xl`): 260% of base (1.625rem)

## Components

UI is built with shadcn/ui primitives wired to the tokens above (`shared/ui/`). Typical patterns:

- **Button**: `default` uses `bg-primary`; `secondary` / `outline` use surface tokens
- **Card**: `bg-card` containers
- **Input**: `border-input`, `ring-ring` on focus
- **Badge**: accent/muted variants

## Do's and Don'ts

**Do:**
- Use semantic Tailwind classes (`bg-primary`, `bg-card`, `text-muted-foreground`) backed by CSS variables
- Maintain consistent spacing using the baseline scale
- Apply `surface-elevated` or `surface-glass` for hierarchy on panels
- Test color contrast for accessibility

**Don't:**
- Override token values outside `app/globals.css` without updating this file and running `pnpm design:lint`
- Mix `surface-elevated` and `surface-glass` on the same panel
- Introduce new typographic scales
- Use hardcoded hex/rgb in components—use theme tokens (`prefer-theme-tokens` is enforced in lint)
