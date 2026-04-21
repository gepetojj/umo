---
name: shadcn-ui-expert
description: Specializes the agent in building UIs with shadcn/ui (official and community). Uses official components from ui.shadcn.com, plus blocks/patterns from shadcn.io and shadcnstudio.com for complete, professional interfaces. Covers component selection, UX, theming, forms, and pre-built blocks. Use when building React/Next.js UIs with shadcn, choosing components, designing layouts, or improving interface quality.
---

# shadcn/ui Expert

Build professional, accessible interfaces using the official shadcn/ui stack and community blocks. Prefer composition and the project's existing `components.json`; extend with community blocks when a full section or pattern is needed.

## Ecosystem (when to use what)

| Source | Use for | URL |
|--------|--------|-----|
| **Official** | Base components, installation, theming, forms, CLI | https://ui.shadcn.com/docs |
| **shadcn.io** | Blocks (Hero, Testimonials, Tables, Command Menu, etc.), patterns, themes, icons | https://www.shadcn.io/ |
| **shadcn/studio** | Component variants, blocks, templates, theme generator | https://shadcnstudio.com/components |

**Rule**: Install and customize base components from the official docs. Use shadcn.io and shadcnstudio for full sections (hero, pricing, dashboard shell) or when you need a ready-made block that combines several components.

## Installation and project setup

- **New component (official)**: `pnpm dlx shadcn@latest add <component>` (or npx/yarn). Respects `components.json` (style, aliases, baseColor).
- **Existing project**: Check `components.json` for `style` (new-york/default), `tailwind.css` path, and `aliases`. Add components only under the configured `ui` path (e.g. `@/components/ui`).
- **Community blocks**: Copy code from shadcn.io or shadcnstudio into the project; ensure required shadcn components are installed first, then adjust imports and styles to match the project.

Do not change `components.json` style or aliases unless the user requests it. Keep one icon library (e.g. lucide-react) consistent.

## Component selection (UX-first)

Choose the component that best fits the **task and context**, not just the first match.

- **Actions**: `Button` (primary/secondary/ghost/destructive), `Button Group` for related actions.
- **Forms**: `Input`, `Textarea`, `Select`, `Checkbox`, `Radio Group`, `Switch`. Use `Field` + `Label` for structure; `Form` (React Hook Form + Zod) for validation and errors.
- **Selection (many options)**: `Combobox` or `Command` (searchable); `Select` for small lists.
- **Feedback**: `Alert`, `Toast`/`Sonner`, `Skeleton` (loading), `Progress`, `Spinner`.
- **Overlays**: `Dialog` (critical/blocking), `Sheet` (side panel), `Drawer` (mobile), `Popover`/`Hover Card` (non-blocking).
- **Navigation**: `Tabs`, `Navigation Menu`, `Sidebar`, `Breadcrumb`, `Dropdown Menu`.
- **Data**: `Table`, `Data Table` (sort/filter), `Card` for content blocks, `Calendar`/`Date Picker` for dates.
- **Layout**: `Separator`, `Scroll Area`, `Resizable`, `Collapsible`, `Aspect Ratio`.

For detailed mapping and patterns, see [reference.md](reference.md).

## Blocks and combinations

- **Landing/marketing**: Use blocks from shadcn.io (Hero, Features, Pricing, Testimonials, CTA). Compose with official `Button`, `Card`, `Badge`, `Tabs`.
- **Dashboards**: Use Dashboard Shell / Sidebar blocks; combine `Card`, `Chart`, `Data Table`, `Dropdown Menu`, `Sheet`.
- **Forms and onboarding**: Multi-step forms with `Tabs` or steps + `Button` (next/back). Use official Form + React Hook Form + Zod for validation.
- **Command palette**: Use `Command` (official) or Command Menu blocks from shadcn.io for ⌘K-style UX.
- **Empty and error states**: Use `Empty` or custom layout with `Alert`, `Button`, and illustration/copy.

Prefer reusing the project’s existing components and tokens (colors, radius, spacing) when integrating a block so the result feels native.

## Theming and consistency

- Use CSS variables defined in `globals.css` (e.g. `--background`, `--foreground`, `--primary`, `--muted`). Do not hardcode brand colors in components.
- Dark mode: Prefer `next-themes` and semantic variables so components stay theme-agnostic.
- Keep `baseColor` and `style` from `components.json` consistent; only suggest a change when the user asks for a different look.

## Accessibility and polish

- Preserve Radix primitives’ behavior: focus, keyboard nav, ARIA. Do not remove `asChild` or override focus styles without reason.
- Use `Label` with form controls; group related fields in `Field` or a fieldset.
- For loading: use `Skeleton` or `Spinner` and `aria-busy`/`aria-live` where appropriate.
- Touch targets: keep buttons and interactive areas at least 44px where possible, especially in blocks used on mobile.

## Forms (React Hook Form + Zod)

- Use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` with `@hookform/resolvers/zod` and Zod schemas.
- Map inputs to shadcn components (`Input`, `Select`, `Checkbox`, etc.) inside `FormControl` so validation and errors are shown via `FormMessage`.

## Quick reference

- **Official docs**: https://ui.shadcn.com/docs  
- **Official components list**: https://ui.shadcn.com/docs/components  
- **shadcn.io (blocks, patterns, themes)**: https://www.shadcn.io/  
- **shadcn/studio (variants, blocks, theme generator)**: https://shadcnstudio.com/components  

For component→use-case mapping, UX patterns, and block integration tips, see [reference.md](reference.md).
