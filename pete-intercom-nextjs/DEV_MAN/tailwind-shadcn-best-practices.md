# Tailwind CSS + shadcn/ui Best Practices

## Core Principles

### 1. **NEVER Write Inline Styles**
❌ Bad:
```tsx
<div style={{ padding: '20px', backgroundColor: '#2d72d2' }}>
```

✅ Good:
```tsx
<div className="p-5 bg-primary">
```

### 2. **Use shadcn/ui Components for ALL UI Elements**
❌ Bad:
```tsx
<button style={{ background: '#2d72d2', padding: '8px 18px' }}>
  Click Me
</button>
```

✅ Good:
```tsx
import { Button } from '@/components/ui/button';
<Button className="px-5">Click Me</Button>
```

### 3. **Utility Classes Only in Components**
❌ Bad (in globals.css):
```css
button {
  background: #2d72d2;
  padding: 8px 18px;
  border-radius: 4px;
}
```

✅ Good (in component):
```tsx
<Button className="bg-primary px-5 rounded-md">
```

### 4. **Consistent Spacing Scale**
Use Tailwind's spacing scale consistently:
- Small gaps: `gap-2` or `gap-3`
- Medium gaps: `gap-4` or `gap-6`
- Large gaps: `gap-8`
- Form element spacing: `space-y-4` or `space-y-5`

### 5. **Consistent Text Sizes**
- Headings: `text-4xl` (page title), `text-2xl` (card title), `text-xl` (subsections)
- Body text: `text-base` or `text-lg`
- Labels: `text-base`
- Descriptions: `text-base` with `text-muted-foreground`
- Small text: `text-sm`

### 6. **Use CSS Variables from @theme**
In Tailwind v4, define colors in `@theme` block in globals.css:

```css
@theme {
  --color-primary: #2d72d2;
  --color-muted: #f1f5f9;
}
```

Then use in components:
```tsx
<div className="bg-primary text-muted-foreground">
```

## shadcn/ui Component Guidelines

### Available Components
Always use these instead of creating custom elements:

- **Layout**: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- **Forms**: `Input`, `Textarea`, `Label`, `Select`, `Checkbox`, `RadioGroup`
- **Actions**: `Button` (variants: default, outline, ghost, destructive)
- **Feedback**: `Alert`, `Badge`, `Toast`, `Dialog`
- **Navigation**: `Tabs`, `Accordion`, `DropdownMenu`

### Component Usage Patterns

#### Cards
```tsx
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle className="text-2xl">Title</CardTitle>
    <CardDescription className="text-base">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* Content */}
    </div>
  </CardContent>
</Card>
```

#### Form Fields
```tsx
<div className="space-y-2">
  <Label htmlFor="field" className="text-base">
    Field Label
  </Label>
  <Input
    id="field"
    placeholder="Enter value"
    className="h-11 text-base"
  />
</div>
```

#### Buttons
```tsx
{/* Primary action */}
<Button className="w-full h-12 text-base font-medium">
  Submit
</Button>

{/* Secondary action */}
<Button variant="outline" className="h-11 text-base">
  Cancel
</Button>
```

## Layout Patterns

### Page Structure
```tsx
export default function Page() {
  return (
    <div className="space-y-8">
      {/* Centered page header */}
      <div className="text-center space-y-3 pb-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Page Title
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Page description
        </p>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Cards */}
      </div>
    </div>
  );
}
```

### Responsive Grid
```tsx
{/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

{/* Mobile: 1 col, Desktop: 2 cols */}
<div className="grid gap-4 lg:grid-cols-2">
```

### Consistent Spacing
```tsx
{/* Vertical spacing between sections */}
<div className="space-y-8">

{/* Vertical spacing within forms */}
<div className="space-y-4">

{/* Horizontal spacing */}
<div className="flex gap-4">
```

## Color Usage

### Semantic Colors
```tsx
{/* Primary brand color */}
<div className="bg-primary text-primary-foreground">

{/* Muted backgrounds */}
<div className="bg-muted text-muted-foreground">

{/* Success */}
<div className="bg-green-50 text-green-900">

{/* Error */}
<div className="bg-red-50 text-red-900">

{/* Borders */}
<div className="border border-border">
```

### Never Hardcode Colors
❌ Bad:
```tsx
<div className="bg-[#2d72d2]">
```

✅ Good:
```tsx
<div className="bg-primary">
```

## Common Mistakes to Avoid

### 1. Mixing CSS and Tailwind
❌ Bad:
```css
/* globals.css */
button {
  padding: 10px;
}
```
```tsx
<button className="bg-primary">
```
**Problem**: Conflicts between CSS and Tailwind utilities

### 2. Not Using Component Variants
❌ Bad:
```tsx
<button className="bg-gray-200 text-gray-700 hover:bg-gray-300">
```

✅ Good:
```tsx
<Button variant="outline">
```

### 3. Inconsistent Sizing
❌ Bad:
```tsx
<Input className="h-9" />
<Button className="h-12" />
<Input className="h-10" />
```

✅ Good:
```tsx
<Input className="h-11 text-base" />
<Button className="h-11 text-base" />
<Input className="h-11 text-base" />
```

### 4. Missing Hover States
❌ Bad:
```tsx
<Card>
```

✅ Good:
```tsx
<Card className="hover:shadow-lg transition-shadow">
```

### 5. Poor Accessibility
❌ Bad:
```tsx
<input placeholder="Email" />
```

✅ Good:
```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" placeholder="user@example.com" />
```

## Tailwind v4 Specifics

### Import Statement
```css
/* globals.css - First line */
@import "tailwindcss";
```

### Theme Configuration
```css
@theme {
  --color-primary: #2d72d2;
  --color-secondary: #f1f5f9;
  --radius-md: 0.5rem;
}
```

### No tailwind.config.js
Tailwind v4 doesn't use `tailwind.config.js` - all configuration is in CSS via `@theme`.

## Quick Checklist

Before committing UI code, verify:

- [ ] No inline `style` attributes
- [ ] All buttons use `<Button>` component
- [ ] All inputs use `<Input>` or `<Textarea>` components
- [ ] Consistent spacing (`space-y-4`, `space-y-5`, `space-y-8`)
- [ ] Consistent text sizes (`text-base` for body, `text-2xl` for cards)
- [ ] Proper component structure (`Card` → `CardHeader` → `CardTitle`/`CardDescription` → `CardContent`)
- [ ] Hover states on interactive elements
- [ ] Proper labels with `htmlFor` linking to input `id`
- [ ] Responsive design with grid breakpoints
- [ ] Using semantic color classes (`bg-primary`, not `bg-blue-600`)

## Example: Perfect Form Card

```tsx
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle className="text-2xl">User Information</CardTitle>
    <CardDescription className="text-base">
      Enter your details below
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-5">
      <div>
        <Label htmlFor="name" className="text-base">Full Name</Label>
        <Input
          id="name"
          placeholder="John Doe"
          className="h-11 text-base mt-2"
        />
      </div>
      <div>
        <Label htmlFor="email" className="text-base">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          className="h-11 text-base mt-2"
        />
      </div>
      <Button className="w-full h-12 text-base font-medium">
        Submit
      </Button>
    </div>
  </CardContent>
</Card>
```

## Resources

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind Color Palette](https://tailwindcss.com/docs/customizing-colors)