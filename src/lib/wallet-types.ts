/**
 * Shared types and constants for wallet functionality.
 * 
 * SECURITY NOTE: This file defines the shape of wallet data.
 * The Wallet interface contains sensitive privateKey field.
 */

/**
 * Represents a generated HD wallet.
 */
export interface Wallet {
    publicKey: string;    // Base58 (Solana) or hex address (Ethereum)
    privateKey: string;   // Base58 (Solana) or hex (Ethereum)
    path: string;         // Derivation path used
}

/**
 * Human-readable names for BIP44 path types.
 */
export const PATH_TYPE_NAMES: { [key: string]: string } = {
    "501": "Solana",
    "60": "Ethereum",
};

/**
 * localStorage keys for wallet persistence.
 * These keys MUST NOT be changed to maintain backward compatibility.
 */
export const STORAGE_KEYS = {
    WALLETS: "wallets",
    MNEMONICS: "mnemonics",
    CHAIN: "chain",
} as const;
