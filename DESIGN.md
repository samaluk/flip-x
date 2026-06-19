---
colors:
  primary: "#4dd0e1"
  on-primary: "#001f2c"
  background: "#0a0e27"
  foreground: "#f5f7fa"
  surface: "#151b2e"
  on-surface: "#f5f7fa"
  surface-muted: "#1a2133"
  on-surface-muted: "#a0a8b8"
  accent: "#232d45"
  on-accent: "#f0f2f5"
  danger: "#ff6b6b"
  border: "#4a525c"
  input: "#3a4250"
  focus-ring: "#4dd0e1"
  data-1: "#4dd0e1"
  data-2: "#a0a8b8"
  data-3: "#5a6270"
  data-4: "#404d5c"
  data-5: "#2a3240"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  2xl: "1.125rem"
  3xl: "1.375rem"
  4xl: "1.625rem"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
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

# flip-x

A modern, dark-tabletop UI for the flip-x card game spinoff

**Version**: alpha

## Overview

flip-x is a modern, dark-tabletop user interface for the flip-x press-your-luck card game spinoff. The design system is built on a carefully calibrated dark theme with high contrast, accessible color ratios, and a refined visual hierarchy. All components use a consistent palette and spacing system, with a focus on clarity and visual feedback.

## Colors

The color palette is based on oklch color space for perceptually uniform color transitions and accessible contrast ratios.

- **Primary**: Action colors and highlights
- **Surface**: Backgrounds and card surfaces
- **Accent**: Secondary highlights and UI emphasis
- **Danger**: Error states and destructive actions
- **Data Series**: Chart and visualization colors (1-5)
- **Border**: Subtle dividers and edges

## Typography

Three core typeface families provide the typographic scale:

- **Sans**: Body text and UI labels (system variable: `--font-sans`)
- **Heading**: Display and section headings (system variable: `--font-heading`)
- **Mono**: Code and tabular data (system variable: `--font-geist-mono`)

## Layout

Spacing follows a fixed baseline scale:

- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 24px
- **2xl**: 32px

All layout utilities use Tailwind CSS with this working scale.

## Elevation & Depth

Two elevation styles create visual separation:

- **Surface Elevated**: High-contrast card with inset light border and drop shadow
- **Surface Glass**: Semi-transparent glass effect with backdrop blur and frosted border

## Shapes

Border radius scales from a base value:

- **sm**: 60% of base (0.375rem)
- **md**: 80% of base (0.5rem)
- **lg**: 100% of base (0.625rem)
- **xl**: 140% of base (0.875rem)
- **2xl**: 180% of base (1.125rem)
- **3xl**: 220% of base (1.375rem)
- **4xl**: 260% of base (1.625rem)

## Components

The design system includes baseline token definitions for:

- **Button Primary**: Primary actions with primary color background
- **Button Secondary**: Secondary actions with surface background
- **Card**: Content container with surface styling
- **Input**: Form fields with input background and focus ring
- **Badge**: Small tags and labels with accent styling

## Do's and Don'ts

**Do:**
- Use the primary color for primary actions and critical interactive elements
- Maintain consistent spacing using the baseline scale
- Apply elevation styles to create clear visual hierarchy
- Test color contrast ratios for accessibility compliance

**Don't:**
- Override color values outside the defined palette
- Mix elevation styles on the same surface
- Introduce new typographic scales
- Use hardcoded color values—always reference CSS variables
