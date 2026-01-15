# ENGINEERING GUIDELINES

> Last updated: January 2026

Welcome to ForgeSphere! This guide establishes coding patterns, conventions, and workflows to ensure consistent development—whether you're a human contributor or an AI agent.

---

## Table of Contents

1. [Code Style & Conventions](#code-style--conventions)
2. [Package Manager](#package-manager)
3. [Component Patterns](#component-patterns)
4. [State Management Patterns](#state-management-patterns)
5. [Adding New Features](#adding-new-features)
6. [shadcn/ui Usage](#shadcnui-usage)
7. [Animation Guidelines](#animation-guidelines)
8. [Toast Notifications](#toast-notifications)
9. [Pre-Commit Checklist](#pre-commit-checklist)

---

## Code Style & Conventions

### Comments

- Prefer **self-explanatory code** over comments.
- Do **not** add comments that restate what the code already expresses.
- Comments are allowed only when explaining:
  - security-sensitive behavior
  - non-obvious logic
  - architectural decisions
- Avoid inline comments for obvious operations.
- Remove comments added only for verbosity or narration.

### Key Conventions

| Path | Convention |
|------|------------|
| `src/components/ui/` | shadcn/ui components—regenerate with CLI, don't edit manually |
| `src/components/*.tsx` | Custom components—PascalCase filenames |
| `src/hooks/use-*.ts` | Custom hooks—kebab-case with `use-` prefix |
| `src/lib/*.ts` | Utility functions—kebab-case filenames |

---

## Package Manager

This project uses **pnpm**.

All commands must be run using pnpm:

- `pnpm install`
- `pnpm run dev`
- `pnpm run build`

Do not use `npm` or `yarn`.

---

## Code Style & Conventions

### TypeScript

- **Strict mode enabled**: All code must be type-safe
- **Explicit types**: Use explicit types for function parameters and return values
- **Interfaces over types**: Prefer `interface` for object shapes

```typescript
// ✅ Good
interface Wallet {
    publicKey: string;
    privateKey: string;
    mnemonic: string;
    path: string;
}

function generateWallet(mnemonic: string, index: number): Wallet | null {
    // ...
}

// ❌ Avoid
type Wallet = {
    publicKey: any;  // No 'any'
}

const generateWallet = (m, i) => { /* No implicit any */ }
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `WalletGenerator` |
| Functions | camelCase | `handleGenerateWallet` |
| Event handlers | `handle` + Action | `handleDeleteWallet` |
| Boolean state | `is`/`show`/`visible` prefix | `showMnemonic`, `isLoading` |
| Constants | camelCase (for objects) | `pathTypeNames` |
| CSS classes | Tailwind utilities | `text-primary/80` |

### File Organization

Each component file should follow this order:

```typescript
"use client"; // If needed

// 1. External imports
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

// 2. Internal imports (components)
import { Button } from "@/components/ui/button";

// 3. Internal imports (hooks, utils)
import { useToast } from "@/hooks/use-toast";

// 4. Types/Interfaces
interface Wallet {
    // ...
}

// 5. Component definition
const WalletGenerator = () => {
    // State declarations
    // Effects
    // Handler functions
    // Return JSX
};

// 6. Export
export default WalletGenerator;
```

---

## Component Patterns

### Client Components

Use `"use client"` directive when the component:
- Uses React hooks (`useState`, `useEffect`, etc.)
- Has event handlers
- Uses browser APIs
- Uses client-only libraries (e.g., `framer-motion`)

```typescript
"use client";

import { useState } from "react";

const InteractiveComponent = () => {
    const [state, setState] = useState(false);
    return <button onClick={() => setState(!state)}>Toggle</button>;
};
```

### Server Components (Default)

Keep components as server components when possible (no interactivity needed):

```typescript
// No "use client" directive
import Image from "next/image";

const StaticComponent = () => {
    return <Image src="/logo.png" alt="Logo" width={100} height={100} />;
};
```

### Component Props Pattern

```typescript
interface ButtonProps {
    variant?: "default" | "destructive" | "ghost";
    size?: "sm" | "lg";
    onClick?: () => void;
    children: React.ReactNode;
}

const CustomButton = ({ variant = "default", size, onClick, children }: ButtonProps) => {
    return (
        <Button variant={variant} size={size} onClick={onClick}>
            {children}
        </Button>
    );
};
```

---

## State Management Patterns

### Local State with localStorage Sync

When state needs to persist, follow this pattern:

```typescript
// 1. Define state
const [wallets, setWallets] = useState<Wallet[]>([]);

// 2. Hydrate from localStorage on mount
useEffect(() => {
    const stored = localStorage.getItem("wallets");
    if (stored) {
        setWallets(JSON.parse(stored));
    }
}, []);

// 3. Sync to localStorage on state change (in handlers, not effects)
const handleAddWallet = () => {
    const newWallet = /* ... */;
    const updated = [...wallets, newWallet];
    setWallets(updated);
    localStorage.setItem("wallets", JSON.stringify(updated)); // Sync immediately
};
```

### localStorage Keys Reference

| Key | Content |
|-----|---------|
| `wallets` | Array of wallet objects |
| `mnemonics` | Array of mnemonic words |
| `paths` | Array of path type strings |

### Visibility Toggle Pattern

For showing/hiding sensitive data per-item:

```typescript
const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([]);

// Toggle specific index
const toggleVisibility = (index: number) => {
    setVisiblePrivateKeys(
        visiblePrivateKeys.map((visible, i) => (i === index ? !visible : visible))
    );
};

// Add new item (default hidden)
const addWallet = () => {
    setVisiblePrivateKeys([...visiblePrivateKeys, false]);
};

// Remove item
const removeWallet = (index: number) => {
    setVisiblePrivateKeys(visiblePrivateKeys.filter((_, i) => i !== index));
};
```

---

## Adding New Features

### Adding a New Blockchain

To add support for a new blockchain (e.g., Bitcoin):

1. **Add path type constant** in `WalletGenerator.tsx`:
   ```typescript
   const pathTypeNames: { [key: string]: string } = {
       "501": "Solana",
       "60": "Ethereum",
       "0": "Bitcoin",  // Add new chain
   };
   ```

2. **Add chain selection button**:
   ```tsx
   <Button onClick={() => setPathTypes(["0"])}>
       Bitcoin
   </Button>
   ```

3. **Add derivation logic** in `generateWalletFromMnemonic`:
   ```typescript
   } else if (pathType === "0") {
       // Bitcoin derivation logic
       // Use appropriate library (e.g., bitcoinjs-lib)
       // Return { publicKey, privateKey, mnemonic, path }
   }
   ```

4. **Install required dependencies**:
   ```bash
   npm install [necessary-dependencies]
   ```

5. **Update ARCHITECTURE.md** with new chain documentation.

### Adding a New UI Component

1. **Check if shadcn/ui has it**:
   ```bash
   npx shadcn@latest add [component-name]
   ```

2. **If custom component needed**, create in `src/components/`:
   ```typescript
   // src/components/NewComponent.tsx
   "use client";
   
   interface NewComponentProps {
       // ...
   }
   
   const NewComponent = ({ }: NewComponentProps) => {
       return (/* ... */);
   };
   
   export default NewComponent;
   ```

3. **Add to imports alias** if needed (already configured in `tsconfig.json`).

---

## shadcn/ui Usage

### Installation

```bash
# Add a new shadcn/ui component
npx shadcn@latest add button
npx shadcn@latest add alert-dialog
```

### Import Pattern

Always use the `@/` alias:

```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
```

### Styling with Variants

Use the `variant` and `size` props:

```tsx
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Subtle</Button>
<Button size="lg">Large Button</Button>
```

### DO NOT Edit `src/components/ui/` Directly

If customization is needed, either:
1. Override via Tailwind classes on usage
2. Create a wrapper component
3. Modify the shadcn/ui source only if absolutely necessary (document why)

---

## Animation Guidelines

### Framer Motion Patterns

Use consistent animation variants:

```typescript
// Standard fade-in-up animation
<motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
        duration: 0.3,
        ease: "easeInOut",
    }}
>
    {/* Content */}
</motion.div>

// With delay (for staggered lists)
<motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
        delay: 0.3 + index * 0.1, // Stagger by index
        duration: 0.3,
        ease: "easeInOut",
    }}
>
    {/* List item */}
</motion.div>
```

### Standard Values

| Property | Value | Notes |
|----------|-------|-------|
| `duration` | `0.3` | Default animation duration |
| `ease` | `"easeInOut"` | Default easing |
| `delay` | `0.3` | Base delay for sequences |
| `y` offset | `-20` | Standard vertical offset for entrance |

---

## Toast Notifications

### Basic Usage

```typescript
const { toast } = useToast();

// Success (default)
toast({
    description: "Wallet generated successfully!",
});

// Error
toast({
    description: "Invalid recovery phrase. Please try again.",
    variant: "destructive",
});
```

### Standard Messages

| Action | Message |
|--------|---------|
| Wallet generated | `"Wallet generated successfully!"` |
| Wallet deleted | `"Wallet deleted successfully!"` |
| Clear all | `"All wallets cleared."` |
| Copy | `"Copied to clipboard!"` |
| Invalid mnemonic | `"Invalid recovery phrase. Please try again."` |
| Unsupported chain | `"Unsupported path type."` |

### Guidelines

1. Keep messages concise (< 50 characters)
2. Use `variant: "destructive"` only for errors
3. Always provide feedback for user actions
4. Don't show toasts for passive state changes

---

## Post-Change Verification Checklist

Before committing changes, verify:

### Code Quality
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] No ESLint warnings (`npm run lint` passes)
- [ ] No `console.log` statements (except in development)
- [ ] No `any` types without justification

### Security (see SECURITY.md)
- [ ] No logging of private keys or mnemonics
- [ ] Mnemonic validation still works
- [ ] Destructive actions have confirmation dialogs
- [ ] Private keys hidden by default

### UX Consistency
- [ ] Animations follow standard patterns
- [ ] Toast messages follow conventions
- [ ] Loading/error states handled
- [ ] Responsive design works (mobile + desktop)

### Documentation
- [ ] ARCHITECTURE.md updated if structure changed
- [ ] SECURITY.md updated if security-relevant
- [ ] Code comments for non-obvious logic

---

## Getting Help

- Review `ARCHITECTURE.md` for system design
- Review `SECURITY.md` before touching crypto code
- Check existing patterns in `WalletGenerator.tsx` for examples
