# Mylance Design System & Style Guide

_Modern LinkedIn Content Creation Platform_

## Overview

This style guide is based on inspirational designs provided and tailored for the mylance platform - an AI-powered LinkedIn content creation tool. The design emphasizes clean, professional aesthetics with modern SaaS patterns.

## Color Palette

### Primary Colors

```css
--primary-50: #f0f9ff
--primary-100: #e0f2fe
--primary-200: #bae6fd
--primary-300: #7dd3fc
--primary-400: #38bdf8
--primary-500: #0ea5e9  /* Main brand color */
--primary-600: #0284c7
--primary-700: #0369a1
--primary-800: #075985
--primary-900: #0c4a6e
```

### Neutral Colors

```css
--gray-50: #f8fafc
--gray-100: #f1f5f9
--gray-200: #e2e8f0
--gray-300: #cbd5e1
--gray-400: #94a3b8
--gray-500: #64748b
--gray-600: #475569
--gray-700: #334155
--gray-800: #1e293b
--gray-900: #0f172a
```

### Semantic Colors

```css
--success-500: #10b981
--warning-500: #f59e0b
--error-500: #ef4444
--info-500: #3b82f6
```

### Background Colors

```css
--bg-primary: #ffffff
--bg-secondary: #f8fafc
--bg-tertiary: #f1f5f9
--bg-dark: #0f172a
--bg-overlay: rgba(15, 23, 42, 0.6)
```

## Typography

### Font Stack

```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Type Scale

```css
/* Headlines */
--text-5xl: 3rem (48px)     /* Hero titles */
--text-4xl: 2.25rem (36px)  /* Page titles */
--text-3xl: 1.875rem (30px) /* Section headers */
--text-2xl: 1.5rem (24px)   /* Card titles */
--text-xl: 1.25rem (20px)   /* Subheadings */

/* Body Text */
--text-lg: 1.125rem (18px)  /* Large body */
--text-base: 1rem (16px)    /* Default body */
--text-sm: 0.875rem (14px)  /* Small text */
--text-xs: 0.75rem (12px)   /* Captions */
```

### Font Weights

```css
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

## Layout & Spacing

### Container Widths

```css
--container-sm: 640px
--container-md: 768px
--container-lg: 1024px
--container-xl: 1280px
--container-2xl: 1536px
```

### Spacing Scale

```css
--space-1: 0.25rem (4px)
--space-2: 0.5rem (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem (16px)
--space-5: 1.25rem (20px)
--space-6: 1.5rem (24px)
--space-8: 2rem (32px)
--space-10: 2.5rem (40px)
--space-12: 3rem (48px)
--space-16: 4rem (64px)
--space-20: 5rem (80px)
```

## Component Styles

### Buttons

#### Primary Button

```css
.btn-primary {
  background: var(--primary-500);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-primary:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
}
```

#### Secondary Button

```css
.btn-secondary {
  background: white;
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}
```

#### Ghost Button

```css
.btn-ghost {
  background: transparent;
  color: var(--gray-600);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}
```

### Cards

#### Base Card

```css
.card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

#### Stats Card

```css
.stats-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stats-card .value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 4px;
}

.stats-card .label {
  font-size: 14px;
  color: var(--gray-600);
  font-weight: 500;
}
```

### Forms

#### Input Field

```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 400;
  background: white;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.input::placeholder {
  color: var(--gray-400);
}
```

#### Textarea

```css
.textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 400;
  background: white;
  resize: vertical;
  min-height: 120px;
  transition: all 0.2s ease;
}

.textarea:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}
```

#### Form Label

```css
.label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
  margin-bottom: 6px;
}
```

### Navigation

#### Sidebar Navigation

```css
.sidebar {
  width: 256px;
  height: 100vh;
  background: white;
  border-right: 1px solid var(--gray-200);
  padding: 24px 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: var(--gray-600);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
}

.sidebar-item:hover {
  background: var(--gray-50);
  color: var(--gray-900);
}

.sidebar-item.active {
  background: var(--primary-50);
  color: var(--primary-600);
  border-right: 2px solid var(--primary-500);
}
```

#### Top Navigation

```css
.topnav {
  height: 64px;
  background: white;
  border-bottom: 1px solid var(--gray-200);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

### Data Display

#### Table

```css
.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table th {
  background: var(--gray-50);
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: var(--gray-700);
  border-bottom: 1px solid var(--gray-200);
}

.table td {
  padding: 16px;
  border-bottom: 1px solid var(--gray-200);
  font-size: 14px;
  color: var(--gray-600);
}

.table tr:hover {
  background: var(--gray-50);
}
```

#### Badge/Tag

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: var(--gray-100);
  color: var(--gray-700);
}

.badge.success {
  background: var(--success-50);
  color: var(--success-700);
}

.badge.warning {
  background: var(--warning-50);
  color: var(--warning-700);
}

.badge.error {
  background: var(--error-50);
  color: var(--error-700);
}
```

## Layout Patterns

### Dashboard Layout

```css
.dashboard-layout {
  display: grid;
  grid-template-columns: 256px 1fr;
  grid-template-rows: 64px 1fr;
  height: 100vh;
  grid-template-areas:
    "sidebar header"
    "sidebar main";
}

.dashboard-header {
  grid-area: header;
}

.dashboard-sidebar {
  grid-area: sidebar;
}

.dashboard-main {
  grid-area: main;
  padding: 24px;
  background: var(--bg-secondary);
  overflow-y: auto;
}
```

### Grid Layouts

```css
/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

/* Card Grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}
```

## Animation & Transitions

### Micro-interactions

```css
/* Hover Effects */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Loading States */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-100) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Fade In */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Responsive Breakpoints

```css
/* Mobile First Approach */
@media (min-width: 640px) {
  /* sm */
}
@media (min-width: 768px) {
  /* md */
}
@media (min-width: 1024px) {
  /* lg */
}
@media (min-width: 1280px) {
  /* xl */
}
@media (min-width: 1536px) {
  /* 2xl */
}
```

### Mobile Adaptations

```css
/* Mobile Navigation */
@media (max-width: 768px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main";
  }

  .dashboard-sidebar {
    display: none;
  }

  .mobile-menu-open .dashboard-sidebar {
    display: block;
    position: fixed;
    top: 64px;
    left: 0;
    width: 100%;
    height: calc(100vh - 64px);
    z-index: 50;
    background: white;
  }
}
```

## AI-Specific Components

### Content Generation Card

```css
.ai-generator-card {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  border-radius: 16px;
  padding: 32px;
  position: relative;
  overflow: hidden;
}

.ai-generator-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="white" opacity="0.1"/></svg>');
  pointer-events: none;
}
```

### Writing Profile Card

```css
.writing-profile-card {
  background: white;
  border: 2px solid var(--primary-100);
  border-radius: 12px;
  padding: 24px;
  position: relative;
}

.writing-profile-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--primary-500);
  border-radius: 2px 0 0 2px;
}
```

## Usage Guidelines

### Do's

- Use consistent spacing from the scale
- Maintain color contrast ratios (4.5:1 minimum)
- Apply hover states to interactive elements
- Use semantic colors for status indicators
- Keep card shadows subtle and consistent

### Don'ts

- Don't use more than 3 font weights per page
- Don't mix different border radius values
- Don't use pure black (#000000) for text
- Don't stack multiple shadows
- Don't use colors outside the defined palette

## Implementation Notes

This design system should be implemented using:

- **Tailwind CSS** for utility classes
- **CSS Custom Properties** for color tokens
- **Shadcn/ui** as the base component library
- **Framer Motion** for advanced animations (if needed)

All components should be built with accessibility in mind, including proper ARIA labels, keyboard navigation, and screen reader support.
