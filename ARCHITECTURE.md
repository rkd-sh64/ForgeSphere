# ForgeSphere Architecture

> Last updated: January 2026

## Overview

ForgeSphere is a **client-side, multi-chain HD wallet generator** built with Next.js 14 (App Router). It enables users to generate and manage hierarchical deterministic (HD) wallets for Solana and Ethereum blockchains—entirely in the browser with no backend dependencies.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| UI Components | shadcn/ui (new-york style) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Solana Crypto | `@solana/web3.js`, `tweetnacl`, `bs58` |
| Ethereum Crypto | `ethers` |
| HD Derivation | `bip39`, `ed25519-hd-key` |

---

## Directory Structure

```
ForgeSphere/
├── public/                     # Static assets (social icons)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── fonts/              # Local Geist fonts
│   │   ├── favicon.ico         # Site favicon
│   │   ├── globals.css         # Global styles & CSS variables
│   │   ├── layout.tsx          # Root layout (ThemeProvider, Navbar, Footer)
│   │   └── page.tsx            # Home page (renders WalletGenerator)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives (button, input, toast, alert-dialog)
│   │   ├── Navbar.tsx          # App header with logo
│   │   ├── Footer.tsx          # Footer with social links
│   │   ├── WalletGenerator.tsx # Core wallet generation component
│   │   └── theme-provider.tsx  # next-themes wrapper
│   ├── hooks/
│   │   └── use-toast.ts        # Toast notification hook
│   └── lib/
│       └── utils.ts            # Utility functions (cn helper)
├── components.json             # shadcn/ui configuration
├── tailwind.config.ts          # Tailwind configuration with CSS variable colors
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

---

## Component Architecture

### Component Hierarchy

```
RootLayout
├── ThemeProvider (dark mode default)
├── Navbar
├── Toaster (global toast notifications)
├── {children}
│   └── Home (page.tsx)
│       └── WalletGenerator ─────────────────────┐
│           ├── Chain Selection (Solana/Ethereum) │
│           ├── Mnemonic Input/Display            │
│           ├── Wallet Cards                      │
│           │   └── AlertDialog (delete confirm)  │
│           └── AlertDialog (clear all wallets)   │
└── Footer
```

### Core Component: `WalletGenerator`

The `WalletGenerator` component (~550 lines) is the application's core. It handles:

1. **Chain Selection**: User selects Solana (`501`) or Ethereum (`60`)
2. **Mnemonic Management**: Generate new or import existing BIP39 mnemonic
3. **Wallet Derivation**: Generate key pairs using HD derivation
4. **Wallet Display**: Show/hide private keys, copy to clipboard
5. **Wallet Persistence**: Store/retrieve from localStorage

---

## State Management

### React Local State

| State Variable | Type | Purpose |
|---------------|------|---------|
| `mnemonicWords` | `string[]` | 12-word BIP39 mnemonic (split) |
| `pathTypes` | `string[]` | Selected chain path types (`"501"` or `"60"`) |
| `wallets` | `Wallet[]` | Array of generated wallet objects |
| `showMnemonic` | `boolean` | Toggle mnemonic phrase visibility |
| `mnemonicInput` | `string` | User-provided mnemonic input |
| `visiblePrivateKeys` | `boolean[]` | Per-wallet private key visibility |
| `gridView` | `boolean` | Toggle grid/list view for wallets |

### localStorage Keys

| Key | Content | Format |
|-----|---------|--------|
| `wallets` | Generated wallet objects | JSON array of `Wallet` |
| `mnemonics` | Current mnemonic words | JSON array of strings |
| `paths` | Selected path types | JSON array of strings |

### Wallet Interface

```typescript
interface Wallet {
    publicKey: string;    // Base58 (Solana) or hex address (Ethereum)
    privateKey: string;   // Base58 (Solana) or hex (Ethereum)
    mnemonic: string;     // Full 12-word phrase
    path: string;         // Derivation path used
}
```

---

## HD Wallet Derivation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                       │
│  ┌──────────────────┐    ┌────────────────────────────────────────────┐ │
│  │ Generate New     │ OR │ Import Existing Mnemonic                   │ │
│  └────────┬─────────┘    └──────────────────┬─────────────────────────┘ │
│           │                                  │                          │
│           ▼                                  ▼                          │
│  ┌──────────────────┐              ┌──────────────────────────────────┐ │
│  │ generateMnemonic │              │ validateMnemonic(input)          │ │
│  │ (bip39)          │              │ (bip39)                          │ │
│  └────────┬─────────┘              └──────────────────┬───────────────┘ │
│           │                                           │                 │
│           └─────────────────┬─────────────────────────┘                 │
│                             ▼                                           │
│              ┌──────────────────────────────┐                           │
│              │ mnemonicToSeedSync(mnemonic) │                           │
│              │ (bip39)                      │                           │
│              └──────────────┬───────────────┘                           │
│                             ▼                                           │
│              ┌──────────────────────────────┐                           │
│              │ derivePath(path, seedHex)    │                           │
│              │ path: m/44'/{type}'/0'/{i}'  │                           │
│              │ (ed25519-hd-key)             │                           │
│              └──────────────┬───────────────┘                           │
│                             │                                           │
│           ┌─────────────────┴─────────────────┐                         │
│           ▼                                   ▼                         │
│  ┌─────────────────────┐           ┌─────────────────────────────────┐  │
│  │ SOLANA (501)        │           │ ETHEREUM (60)                   │  │
│  │ nacl.sign.keyPair   │           │ ethers.Wallet(privateKeyHex)    │  │
│  │ .fromSeed(derived)  │           │                                 │  │
│  │                     │           │                                 │  │
│  │ Public: Base58      │           │ Public: Ethereum address        │  │
│  │ Private: Base58     │           │ Private: Hex string             │  │
│  └─────────────────────┘           └─────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### BIP44 Derivation Paths

| Chain | Path Type | Full Path Pattern |
|-------|-----------|-------------------|
| Solana | `501` | `m/44'/501'/0'/{accountIndex}'` |
| Ethereum | `60` | `m/44'/60'/0'/{accountIndex}'` |

---

## Architectural Invariants

> These invariants describe core architectural assumptions of ForgeSphere.
> Enforcement and security rules are defined in `SECURITY.md`.

### Security Assumptions

1. **Client-only cryptography**  
   All key generation and derivation occur entirely in the browser. No backend or network dependency exists for key material.

2. **Validated mnemonic input**  
   Wallet derivation assumes that any mnemonic used has already been validated.

3. **Client-side storage model**  
   Wallet data is persisted client-side using `localStorage`, with known and documented security tradeoffs.

---

### Functional Invariants

1. **Deterministic derivation**  
   The same mnemonic and derivation path always produce the same key pair.

2. **Account indexing strategy**  
   New wallets use the current wallet count as the derivation index.

3. **Single chain per session**  
   A single chain type is selected and applied consistently within a session.

4. **Explicit persistence sync**  
   Any mutation to wallet state is immediately synchronized to `localStorage`.

---

### UI Invariants

1. **Confirmation for destructive actions**  
   All wallet deletion actions require explicit user confirmation.

2. **Secrets hidden by default**  
   Private keys are masked unless explicitly revealed by the user.

3. **Explicit user feedback**  
   User actions involving sensitive data provide clear visual feedback.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         INITIALIZATION                          │
│                                                                 │
│  useEffect (mount) ──► Read localStorage ──► Hydrate state      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      WALLET GENERATION                          │
│                                                                 │
│  User Click ──► handleGenerateWallet() ──► generateWallet...()  │
│      │                                            │             │
│      │                                            ▼             │
│      │                                    Wallet object         │
│      │                                            │             │
│      ▼                                            ▼             │
│  setWallets([...wallets, wallet])                               │
│      │                                                          │
│      ▼                                                          │
│  localStorage.setItem("wallets", ...)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      WALLET DELETION                            │
│                                                                 │
│  User Click ──► AlertDialog ──► Confirm ──► handleDeleteWallet  │
│                                                  │              │
│                                                  ▼              │
│                                         filter wallet out       │
│                                                  │              │
│                                                  ▼              │
│                                         Update state + storage  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Theming

The application uses **CSS variables** for theming, defined in `globals.css` and consumed via Tailwind's `hsl(var(--*))` pattern.

### Color Tokens

| Token | Purpose |
|-------|---------|
| `--background` | Page background |
| `--foreground` | Primary text |
| `--primary` | Primary brand color |
| `--secondary` | Secondary surfaces |
| `--muted` | Subdued elements |
| `--accent` | Accent highlights |
| `--destructive` | Error/delete actions |
| `--border` | Border colors |
| `--ring` | Focus rings |

### Dark Mode

- Managed by `next-themes` via `ThemeProvider`
- Default theme: `dark`
- Class-based switching (`darkMode: ["class"]` in Tailwind config)

---

## Future Considerations

When extending this architecture, consider:

1. **Additional chains**: Follow the existing pattern in `generateWalletFromMnemonic`
2. **State management**: If complexity grows, consider Redux/Zustand/Jotai
3. **Testing**: Add unit tests for derivation logic (pure functions)
4. **Encryption**: Consider encrypting localStorage with a user password
