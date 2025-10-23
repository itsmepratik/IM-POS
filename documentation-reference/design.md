## 📐 Foundations

### Spacing Scale

| Token/Class      | Value(s)                 | Description / Usage Example          |
| ---------------- | ------------------------ | ------------------------------------ |
| `p-1`, `m-1`     | 0.25rem (4px)            | Smallest padding/margin              |
| `p-2`, `m-2`     | 0.5rem (8px)             | Default for compact elements         |
| `p-3`, `m-3`     | 0.75rem (12px)           | Used for form fields, cards, etc.    |
| `p-4`, `m-4`     | 1rem (16px)              | Default for containers, modals, etc. |
| `p-6`, `m-6`     | 1.5rem (24px)            | Card content, modal padding          |
| `p-8`, `m-8`     | 2rem (32px)              | Large containers, page sections      |
| `gap-1`–`gap-8`  | 4px–32px                 | Grid/flex gap spacing                |
| `responsive-p`   | clamp(1rem, 3vw, 2rem)   | Responsive padding utility           |
| `responsive-gap` | clamp(0.5rem, 2vw, 1rem) | Responsive gap utility               |

- **Naming:** Use Tailwind’s scale (`p-1`, `m-2`, etc.) for consistency.
- **Container Padding:** Default is `2rem` (32px) for `.container` (see `tailwind.config.js`).

---

### Typography

| Token/Class          | Value(s)            | Description / Usage Example               |
| -------------------- | ------------------- | ----------------------------------------- |
| `font-sans`          | Formula1, system-ui | Default body font (Formula1 F1, fallback) |
| `font-wide`          | Formula1 Wide       | Used for headings, special UI             |
| `text-xs`–`text-9xl` | 12px–128px          | Font size scale (see below)               |
| `font-medium`        | 500                 | Button, label, tab text                   |
| `font-semibold`      | 600–700             | Card titles, headings                     |
| `font-bold`          | 700                 | Emphasized headings                       |
| `leading-none`       | 1.0                 | Headings                                  |
| `leading-tight`      | 1.2                 | Subheadings                               |
| `leading-relaxed`    | 1.5                 | Body text                                 |

#### Font Size Scale

| Class       | px  | rem   |
| ----------- | --- | ----- |
| `text-xs`   | 12  | 0.75  |
| `text-sm`   | 14  | 0.875 |
| `text-base` | 16  | 1     |
| `text-lg`   | 18  | 1.125 |
| `text-xl`   | 20  | 1.25  |
| `text-2xl`  | 24  | 1.5   |
| `text-3xl`  | 30  | 1.875 |
| `text-4xl`  | 36  | 2.25  |
| `text-5xl`  | 48  | 3     |
| `text-6xl`  | 60  | 3.75  |
| `text-7xl`  | 72  | 4.5   |
| `text-8xl`  | 96  | 6     |
| `text-9xl`  | 128 | 8     |

- **Hierarchy:**
  - Headings: `font-bold`/`font-semibold`, `leading-none`/`tight`
  - Body: `font-normal`, `leading-relaxed`
- **Buttons/Inputs:** `text-sm` or `text-base` (0.9375rem for compactness)

---

### Color Palette

#### Core Tokens (from `globals.css` and Tailwind config)

| Token                      | Light Mode           | Dark Mode | Usage Example               |
| -------------------------- | -------------------- | --------- | --------------------------- |
| `--background`             | `#fff`               | `#23272f` | App background              |
| `--foreground`             | `#23272f`            | `#fafafa` | App text                    |
| `--primary`                | `#2563eb` (blue-600) | `#2563eb` | Primary buttons, links      |
| `--primary-foreground`     | `#fafafa`            | `#23272f` | Text on primary             |
| `--secondary`              | `#f4f4f5`            | `#29292b` | Secondary buttons, surfaces |
| `--secondary-foreground`   | `#23272f`            | `#fafafa` | Text on secondary           |
| `--muted`                  | `#f4f4f5`            | `#29292b` | Muted backgrounds           |
| `--muted-foreground`       | `#767676`            | `#a3a3a3` | Muted text                  |
| `--accent`                 | `#e0e7ff`            | `#e0e7ff` | Accent backgrounds          |
| `--accent-foreground`      | `#2563eb`            | `#2563eb` | Accent text/icons           |
| `--destructive`            | `#ef4444` (red-500)  | `#991b1b` | Error/danger                |
| `--destructive-foreground` | `#fafafa`            | `#fafafa` | Text on error               |
| `--border`                 | `#e5e7eb`            | `#29292b` | Borders                     |
| `--input`                  | `#e5e7eb`            | `#29292b` | Input backgrounds           |
| `--ring`                   | `#2563eb`            | `#2563eb` | Focus ring                  |

#### Semantic Colors

- **Success:** `bg-green-500 text-white` (used in badges, alerts)
- **Warning:** Use `bg-yellow-400 text-black` (custom, not in tokens)
- **Info:** Use `bg-blue-500 text-white` (custom, not in tokens)
- **Error:** `bg-destructive text-destructive-foreground`

#### Example Usage

```tsx
<Button variant="primary">Primary</Button>
<Button variant="destructive">Delete</Button>
<Badge variant="success">Success</Badge>
<Card className="bg-card text-card-foreground" />
```

---

### Border Radius

| Token/Class    | Value                             | Usage Example          |
| -------------- | --------------------------------- | ---------------------- |
| `rounded-lg`   | `var(--radius)` (8px default)     | Buttons, cards, modals |
| `rounded-md`   | `calc(var(--radius) - 2px)` (6px) | Inputs, dropdowns      |
| `rounded-sm`   | `calc(var(--radius) - 4px)` (4px) | Chips, tags, small UI  |
| `rounded-full` | `9999px`                          | Badges, avatars        |

- **Default:** `--radius: 0.5rem` (8px)
- **Override:** Use Tailwind’s `rounded-*` classes for consistency.

---

### Elevation & Shadows

| Token/Class                 | Value(s) / Description                              |
| --------------------------- | --------------------------------------------------- |
| `shadow-chonky-primary`     | 3D shadow for primary buttons (see Tailwind config) |
| `shadow-chonky-secondary`   | 3D shadow for secondary buttons                     |
| `shadow-chonky-destructive` | 3D shadow for destructive buttons                   |
| `shadow`                    | Standard card/modal shadow                          |
| `shadow-md`, `shadow-lg`    | Used for overlays, popovers, dialogs                |
| `shadow-sm`                 | Used for inputs, subtle elevation                   |

**Example:**

```tsx
<Button variant="primary" className="shadow-chonky-primary">3D Button</Button>
<Card className="shadow" />
<DialogContent className="shadow-lg" />
```

---

## 🧱 Component Guidelines

### Buttons

- **Variants:** `primary` (default), `secondary`, `destructive`, `outline`, `ghost`, `link`
- **States:** `hover`, `active`, `focus`, `disabled`
- **Sizes:** `default`, `sm`, `lg`, `icon`
- **Example:**
  ```tsx
  <Button variant="primary" size="default">Save</Button>
  <Button variant="destructive" size="sm" disabled>Delete</Button>
  <Button variant="outline" size="icon"><Icon /></Button>
  ```
- **Behavior:** 3D shadow, animated press, focus ring, disabled opacity

### Inputs / Text Fields

- **Base:** `rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm`
- **States:** `focus-visible:ring-1 focus-visible:ring-ring`, `disabled:opacity-50`
- **Example:**
  ```tsx
  <Input placeholder="Enter value" />
  <Textarea placeholder="Type here..." />
  ```

### Select Dropdowns

- **Base:** `rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm`
- **States:** `focus:ring-1 focus:ring-ring`, `disabled:opacity-50`
- **Example:**
  ```tsx
  <Select>
    <SelectTrigger>Choose</SelectTrigger>
    <SelectContent>
      <SelectItem value="a">A</SelectItem>
    </SelectContent>
  </Select>
  ```

### Cards

- **Base:** `rounded-xl border bg-card text-card-foreground shadow`
- **Sections:** `CardHeader`, `CardContent`, `CardFooter`
- **Example:**
  ```tsx
  <Card>
    <CardHeader>Title</CardHeader>
    <CardContent>Body</CardContent>
    <CardFooter>Actions</CardFooter>
  </Card>
  ```

### Badges, Chips, Tags

- **Variants:** `default`, `secondary`, `destructive`, `outline`, `success`
- **Base:** `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold`
- **Example:**
  ```tsx
  <Badge variant="success">Active</Badge>
  <Badge variant="destructive">Error</Badge>
  ```

---

## 🪟 Overlays & Dialogs

### Modals / Dialogs

- **Base:** `rounded-lg border bg-background p-6 shadow-lg`
- **Anatomy:** `DialogHeader`, `DialogContent`, `DialogFooter`
- **Z-Index:** `z-50` for overlay, `z-[60]` for close button
- **Padding:** `p-6` for content, `space-y-1.5` for header
- **Example:**
  ```tsx
  <Dialog>
    <DialogTrigger>Open</DialogTrigger>
    <DialogContent>
      <DialogHeader>Title</DialogHeader>
      <DialogFooter>Actions</DialogFooter>
    </DialogContent>
  </Dialog>
  ```

### Popups / Tooltips

- **Popover:** `rounded-md border bg-popover p-4 shadow-md z-50`
- **Tooltip:** `rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground z-50`
- **Trigger:** Use `PopoverTrigger`, `TooltipTrigger`
- **Positioning:** Controlled by Radix UI, responsive to viewport
- **Example:**
  ```tsx
  <Popover>
    <PopoverTrigger>Info</PopoverTrigger>
    <PopoverContent>Details here</PopoverContent>
  </Popover>
  <Tooltip>
    <TooltipTrigger>?</TooltipTrigger>
    <TooltipContent>Help text</TooltipContent>
  </Tooltip>
  ```

### Best Practices

- **Content Structure:** Use clear headers, body, and actions in overlays.
- **Accessibility:** Always provide focus management and keyboard navigation.
- **Animation:** Use `data-[state=open]:animate-in` and `data-[state=closed]:animate-out` for smooth transitions.
- **Stacking:** Use `z-50` or higher for overlays to ensure proper stacking above content.

---

## 📱 Responsive UI: Figma Autolayout Principles in Next.js & Tailwind

Building a truly responsive UI in Next.js with Tailwind CSS is akin to using Figma's autolayout: you want your components to flex, stack, and adapt seamlessly across devices. Here’s how to achieve pixel-perfect, production-grade responsiveness:

### 🔑 Core Principles

- **Mobile-First:** Start with mobile styles, then layer on tablet and desktop overrides.
- **Flex & Grid:** Use `flex` and `grid` utilities for dynamic layouts—just like Figma autolayout.
- **Consistent Spacing:** Use Tailwind’s spacing scale (`gap`, `p-*`, `m-*`) for predictable rhythm.
- **Breakpoint Utilities:** Tailwind’s `sm:`, `md:`, `lg:`, `xl:` prefixes map to device sizes.
- **Intrinsic Sizing:** Use `min-w-0`, `min-h-0`, `w-full`, `h-full` to prevent overflow and enable shrink/grow.

### 📏 Breakpoints

| Device  | Tailwind Prefix | Min Width     | Typical Usage           |
| ------- | --------------- | ------------- | ----------------------- |
| Mobile  | (default)       | 0px           | Phones, small screens   |
| Tablet  | `sm:`/`md:`     | 640px/768px   | Tablets, small laptops  |
| Desktop | `lg:`/`xl:`     | 1024px/1280px | Desktops, large screens |

**Example:**

```tsx
<div className="flex flex-col md:flex-row gap-4">
  <Sidebar className="w-full md:w-64" />
  <main className="flex-1" />
</div>
```

- On mobile: sidebar stacks on top.
- On tablet/desktop: sidebar sits left, content right.

### 🛠️ Responsive Layout Tips & Tricks

- **Auto-Stacking:** Use `flex-col md:flex-row` to stack vertically on mobile, horizontally on desktop.
- **Responsive Gaps:** `gap-2 md:gap-4` for tighter mobile, looser desktop spacing.
- **Hide/Show:** Use `hidden md:block` to show elements only on certain breakpoints.
- **Responsive Grids:**
  ```tsx
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Cards */}
  </div>
  ```
- **Fluid Padding:** `p-4 md:p-8` for more breathing room on larger screens.
- **Text Scaling:** `text-base md:text-lg` for readable, scalable typography.
- **Width Control:** `w-full md:w-1/2` for elements that should grow/shrink.
- **Min/Max Constraints:** Use `max-w-screen-lg`, `min-h-[300px]` for content bounds.
- **Auto Layout with Flex:**
  ```tsx
  <div className="flex flex-col md:flex-row items-stretch">
    <div className="flex-1" />
    <div className="w-full md:w-80" />
  </div>
  ```
- **Overflow Handling:** `overflow-x-auto` for tables/lists on mobile.
- **Responsive Images:** Use Next.js `<Image />` with `sizes` prop for device-optimized images.

### 🎨 Figma Autolayout → Tailwind Mapping

| Figma Autolayout        | Tailwind Utility Example          |
| ----------------------- | --------------------------------- |
| Horizontal/Vertical     | `flex-row` / `flex-col`           |
| Spacing between items   | `gap-4`                           |
| Padding                 | `p-4`                             |
| Alignment (center, end) | `items-center`, `justify-end`     |
| Fill container          | `w-full`, `h-full`, `flex-1`      |
| Hug contents            | `inline-flex`, `w-auto`, `h-auto` |
| Responsive resizing     | `md:w-1/2`, `lg:w-1/3`            |

### 🧩 Best Practices

- **Test at All Breakpoints:** Use browser dev tools and real devices.
- **Prefer Utility Classes:** Avoid custom CSS for layout—Tailwind covers 99% of needs.
- **Use `container` Class:** For max-width and horizontal padding.
- **Leverage SSR/SSG:** Next.js ensures fast, SEO-friendly loads on all devices [[1]](https://dev.to/hitesh_developer/designing-with-flexibility-responsive-nextjs-templates-for-any-device-3183).
- **Optimize Images:** Use Next.js `<Image />` for responsive, lazy-loaded images.
- **Performance:** Minimize layout shift by using fixed heights or aspect ratios for images and cards.
- **Accessibility:** Ensure focus states and readable font sizes at all breakpoints.

### 📚 Further Reading

- [Designing with Flexibility: Responsive Next.js Templates for Any Device](https://dev.to/hitesh_developer/designing-with-flexibility-responsive-nextjs-templates-for-any-device-3183)
- [Effortless Responsiveness: Tailwind CSS Tips and Tricks for Next.js Developers](https://medium.com/@rameshkannanyt0078/effortless-responsiveness-tailwind-css-tips-and-tricks-for-next-js-developers-9d8a0544b1b1)

---

## 🛠️ Creating New Components

### 1. Component Anatomy

- Use consistent spacing (`p-4`, `gap-2`), color tokens (`bg-card`, `text-foreground`), and border radius (`rounded-lg`).
- Structure: Compose with atomic UI primitives (Button, Input, Card, etc.).

### 2. Placement Rules

- Place new components in `components/ui/` for primitives, or in feature folders for domain-specific UI.
- Use `flex`, `grid`, and responsive spacing utilities for layout.
- Align content using `flex-center`, `justify-between`, and responsive padding.

### 3. Naming Conventions

- **File/Component:** PascalCase (`Button.tsx`, `CardContent.tsx`)
- **Props:** camelCase (`isActive`, `onClick`)
- **Classes:** kebab-case for custom classes, Tailwind for utility classes

### 4. Documentation Standards

- Document props and usage with TypeScript types and JSDoc comments.
- Add usage examples as code comments or in Storybook/MDX if available.
- For complex components, add a `README.md` in the component folder.

---

## ✅ Final Notes

- **Consistency:** Always use design tokens and Tailwind utilities for new UI.
- **Extensibility:** Extend via `extend` in Tailwind config, not by overriding core classes.
- **Accessibility:** Ensure all interactive components are keyboard accessible and have focus states.
- **Testing:** Use visual regression and unit tests for critical UI.

---

**File:** `doc-ref/design.md`
