# SECURITY GUIDELINES

> Last updated: January 2026

## ⚠️ Critical Notice

ForgeSphere is a **wallet generation tool** that handles cryptographic key material. Mistakes in this codebase can lead to **permanent loss of funds**. All changes must be made in accordance with this file. If any changes are needed here due to any security vulnerabilities, please update this file first and then update the codebase.

---

## Threat Model

### What We Protect

| Asset | Sensitivity | Storage Location |
|-------|-------------|------------------|
| Mnemonic phrases | **Critical** | localStorage, React state |
| Private keys | **Critical** | localStorage, React state |
| Public keys/addresses | Low | localStorage, React state |
| Path types | Low | localStorage, React state |

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    ForgeSphere App                        │  │
│  │                                                           │  │
│  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │  │
│  │  │ React State │ ◄──►│ Crypto Libs │ ◄──►│ localStorage│  │  │
│  │  │ (memory)    │     │ (in-memory) │     │ (disk)      │  │  │
│  │  └─────────────┘     └─────────────┘     └─────────────┘  │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  TRUST BOUNDARY ─────────────────────────────────────────────── │
│                                                                 │
│  Browser Extensions, DevTools, Other Tabs                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                    NETWORK BOUNDARY
                              │
                              ▼
              ┌───────────────────────────────┐
              │  External (Internet)          │
              │  - No key material should     │
              │    ever cross this boundary   │
              └───────────────────────────────┘
```

---

## Security Invariants

> 🚨 **These rules must NEVER be violated.** Any PR or change that breaks these invariants must be rejected.

### 1. No Network Transmission of Key Material

```
❌ NEVER DO THIS:

fetch('/api/backup', { body: JSON.stringify({ privateKey }) })
axios.post(url, { mnemonic })
WebSocket.send(privateKey)
```

**Rule**: Private keys and mnemonic phrases must **never** be sent over any network connection—not even to a "trusted" backend.

### 2. No Console Logging of Secrets

```
❌ NEVER DO THIS:

console.log(privateKey);
console.log('Mnemonic:', mnemonic);
console.debug({ wallet }); // wallet contains privateKey
```

**Rule**: Never log private keys, mnemonics, or any object containing them. This includes `console.log`, `console.debug`, `console.error`, and logging libraries.

### 3. Mnemonic Validation is Mandatory

```typescript
// ✅ ALWAYS validate user-provided mnemonics
if (!validateMnemonic(userInput)) {
    // Reject and show error
    return;
}

// ❌ NEVER skip validation
const seed = mnemonicToSeedSync(userInput); // Dangerous if invalid!
```

**Rule**: All user-provided mnemonic phrases must pass `bip39.validateMnemonic()` before being used for key derivation.

### 4. Confirmation Before Destructive Actions

```typescript
// ✅ ALWAYS use AlertDialog for destructive actions
<AlertDialog>
  <AlertDialogTrigger>Delete Wallet</AlertDialogTrigger>
  <AlertDialogContent>
    {/* Confirmation UI */}
  </AlertDialogContent>
</AlertDialog>

// ❌ NEVER delete without confirmation
<Button onClick={() => handleDeleteWallet(index)}>Delete</Button>
```

**Rule**: Any action that deletes wallet data (single wallet or clear all) must require explicit user confirmation via `AlertDialog`.

### 5. Private Keys Hidden by Default

```typescript
// ✅ CORRECT: Default to hidden
const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([]);
// New wallets get `false` appended

// ❌ WRONG: Default to visible
const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([true]);
```

**Rule**: Private keys must be masked (shown as `•••••`) by default. Users must explicitly click to reveal.

---

## Current Security Limitations

> ⚠️ Users should be aware of these limitations. Document but do not silently "fix" without user consent.

### 1. Unencrypted localStorage

**Current state**: Wallets are stored in localStorage as plaintext JSON.

**Risk**: Any browser extension, XSS attack, or physical device access can read stored keys.

**Mitigation (user-side)**:
- Use ForgeSphere on a trusted device
- Clear wallets when done
- Consider browser security settings

**Future improvement**: Encrypt localStorage with a user-provided password (e.g., using `crypto.subtle`).

### 2. No Secure Enclave Integration

**Current state**: Keys exist in JavaScript memory, accessible to the browser's JavaScript runtime.

**Risk**: Browser extensions or sophisticated attacks could potentially read memory.

**Future improvement**: Investigate WebAuthn / secure enclave APIs for key storage.

### 3. Clipboard Exposure

**Current state**: Users can copy private keys and mnemonics to clipboard.

**Risk**: Other applications can read clipboard contents.

**Mitigation**: This is user-initiated; provide clear feedback when copying sensitive data.

---

## Cryptographic Dependencies

All cryptographic operations rely on well-established libraries. Keep these updated.

| Library | Purpose | Security Notes |
|---------|---------|----------------|
| `bip39` | Mnemonic generation/validation | Uses secure random from crypto API |
| `ed25519-hd-key` | HD key derivation | Standard BIP32-Ed25519 implementation |
| `tweetnacl` | Ed25519 signing (Solana) | Audited, widely used |
| `@solana/web3.js` | Solana keypair handling | Official Solana library |
| `ethers` | Ethereum wallet/signing | Industry standard |
| `bs58` | Base58 encoding (Solana) | Encoding only, no crypto |

### Dependency Update Policy

1. **Monitor** for security advisories on all crypto dependencies
2. **Update promptly** when security patches are released
3. **Test derivation** after updates to ensure consistency
4. **Never** replace crypto libraries without thorough review

---

## Secure Coding Guidelines

### DO ✅

```typescript
// Use built-in validation
if (!validateMnemonic(input)) {
    toast({ description: "Invalid phrase", variant: "destructive" });
    return;
}

// Clear sensitive data when component unmounts (future improvement)
useEffect(() => {
    return () => {
        // Consider zeroing sensitive state
    };
}, []);

// Use secure random for any randomness
const randomBytes = crypto.getRandomValues(new Uint8Array(32));
```

### DON'T ❌

```typescript
// Don't use Math.random() for anything security-related
const entropy = Math.random(); // INSECURE!

// Don't store keys in URLs or query params
router.push(`/wallet?key=${privateKey}`); // NEVER!

// Don't include key material in error messages
throw new Error(`Failed with key: ${privateKey}`); // NEVER!

// Don't use eval or Function constructor with key data
eval(`processKey("${privateKey}")`); // NEVER!
```

---
## Mnemonic Handling Rules

- User-provided mnemonics **must** be validated using `bip39.validateMnemonic()`
- ForgeSphere intentionally supports **12-word mnemonics only** for simplicity and UX clarity

---

## Security Disclosure Note

ForgeSphere is an educational client-side tool, not a production wallet service.
If a security issue is discovered, it should be fixed promptly and documented
clearly in the repository history.

No coordinated disclosure process is currently in place.

---

## Input Validation Checklist

When handling user input in security-sensitive contexts:

- [ ] Mnemonic phrases validated with `validateMnemonic()`
- [ ] Input length limits enforced (mnemonic is 12 words)
- [ ] Character set validation (words from BIP39 wordlist)

---

## Security Review Checklist

Before merging any PR that touches wallet/crypto code:

- [ ] No new network calls added for sensitive data
- [ ] No console logging of keys/mnemonics (even in dev)
- [ ] Mnemonic validation still enforced
- [ ] Destructive actions still require confirmation
- [ ] Private keys still hidden by default
- [ ] Crypto dependencies unchanged or security-reviewed
- [ ] No new third-party dependencies without review

---

## Future Security Improvements

| Improvement | Priority | Complexity |
|-------------|----------|------------|
| Encrypt localStorage with user password | High | Medium |
| Add CSP headers | Medium | Low |
| Implement session timeout / auto-lock | Medium | Medium |
| Memory cleanup on sensitive state changes | Medium | Medium |
| Client-side key derivation Web Worker isolation | Low | High |
| Hardware wallet support (Ledger/Trezor) | Low | High |
