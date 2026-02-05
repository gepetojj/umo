# shadcn/ui Expert — Reference

## Component → use case

| Use case | Primary component(s) | Alternatives / notes |
|----------|----------------------|------------------------|
| Primary action | `Button` (default) | `Button` variant="destructive" for delete |
| Secondary actions | `Button` variant="secondary" or "ghost" | `Button Group` for 2–3 related actions |
| Text input | `Input` | `Input Group` for addons; `Input OTP` for codes |
| Long text | `Textarea` | Resize via class or prop |
| Single choice (few options) | `Select`, `Radio Group` | `Select` for dropdown; Radio for 2–5 visible options |
| Single choice (many) | `Combobox`, `Command` | Searchable list |
| Toggle on/off | `Switch` | `Checkbox` for multi-select toggles |
| Multi-select | `Checkbox` (grouped) | Or `Command` multi-select pattern |
| Date(s) | `Calendar`, `Date Picker` | `Date Picker` for single; Calendar for ranges/custom UI |
| Inline message | `Alert` | `Alert` variant for success/warning/destructive |
| Toast notification | `Sonner` or `Toast` | Prefer Sonner for simple global toasts |
| Loading area | `Skeleton`, `Spinner` | Skeleton for content shape; Spinner for buttons/small areas |
| Progress | `Progress` | For steps or file upload |
| Modal (blocking) | `Dialog` | Use for confirmations or short forms |
| Side panel | `Sheet` | Right/left drawer; good for filters or detail |
| Mobile drawer | `Drawer` | Bottom sheet style on small screens |
| Hover/click popup | `Popover`, `Hover Card` | Popover for forms/actions; Hover Card for preview |
| Tooltip | `Tooltip` | Short label on hover/focus |
| Tabs | `Tabs` | For switching content in same context |
| Nav bar | `Navigation Menu`, `Menubar` | Or `Dropdown Menu` for compact nav |
| App sidebar | `Sidebar` | With `Separator`, nav items, collapse |
| Breadcrumb | `Breadcrumb` | Hierarchy navigation |
| List of links/actions | `Dropdown Menu`, `Context Menu` | Dropdown for header; Context for right-click |
| Content card | `Card` (CardHeader, CardContent, CardFooter) | Use for feature blocks, dashboards |
| Data grid | `Table`, `Data Table` | Data Table for sort/filter/pagination |
| Divider / spacing | `Separator` | Horizontal or vertical |
| Scroll container | `Scroll Area` | When you need styled scrollbar or overflow control |
| Resize panels | `Resizable` | Dashboard layouts |
| Collapse section | `Collapsible`, `Accordion` | Accordion for FAQ/list; Collapsible for single section |
| Avatar | `Avatar` | With optional fallback image |
| Badge / tag | `Badge` | Status, count, category |
| Empty state | `Empty` | Or custom layout with `Alert` + CTA |

## UX patterns

- **One primary action per screen/section**: Use one default `Button`; others secondary or ghost.
- **Destructive actions**: Use `Alert Dialog` + `Button` variant="destructive"; require explicit confirm.
- **Forms**: One column on mobile; group related fields; place submit at end with clear label.
- **Tables**: Use `Data Table` with sort/filter when rows are many; keep row actions in `Dropdown Menu`.
- **Navigation**: Max 5–7 top-level items; use `Sidebar` + `Collapsible` for deep hierarchies.
- **Loading**: Prefer `Skeleton` that matches content layout; use `Spinner` in buttons or small areas.
- **Errors**: Show inline with `FormMessage`; use `Alert` or toast for global/async errors.

## Block integration (shadcn.io / shadcnstudio)

1. **Check dependencies**: Block may use Card, Button, Input, Tabs, etc. Install missing official components first (`pnpm dlx shadcn@latest add <name>`).
2. **Imports**: Point to project aliases (`@/components/ui/...`, `@/lib/utils`). Replace any `cn` usage with the project’s `cn` (e.g. from `@/lib/utils`).
3. **Styles**: Use existing CSS variables; avoid new hardcoded colors. If the block uses Tailwind, keep classes that reference semantic tokens (e.g. `bg-background`, `text-muted-foreground`).
4. **Content**: Replace placeholder text and links with real copy and routes.
5. **Responsive**: Preserve responsive classes (e.g. `md:`, `lg:`); test Sheet/Drawer on small viewports.

## Official docs quick links

- Installation: https://ui.shadcn.com/docs/installation  
- Components: https://ui.shadcn.com/docs/components  
- Theming: https://ui.shadcn.com/docs/theming  
- Dark mode: https://ui.shadcn.com/docs/dark-mode  
- Forms (React Hook Form): https://ui.shadcn.com/docs/forms/react-hook-form  
- CLI: https://ui.shadcn.com/docs/cli  
