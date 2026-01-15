/**
 * localStorage helpers for wallet persistence.
 * 
 * SECURITY NOTE: Wallets are stored as plaintext JSON.
 * This is a known limitation documented in SECURITY.md.
 * 
 * IMPORTANT: The storage keys MUST match the original implementation
 * to maintain backward compatibility with existing user data.
 */

import { Wallet, STORAGE_KEYS } from "./wallet-types";

/**
 * Data structure returned when loading wallets from storage.
 */
export interface StoredWalletData {
    wallets: Wallet[];
    mnemonics: string[];
    chain: string;
}

/**
 * Loads wallet data from localStorage.
 * 
 * @returns The stored wallet data, or null if no complete data exists.
 *          All three keys (wallets, mnemonics, chain) must be present.
 */
export function loadWalletsFromStorage(): StoredWalletData | null {
    const storedWallets = localStorage.getItem(STORAGE_KEYS.WALLETS);
    const storedMnemonic = localStorage.getItem(STORAGE_KEYS.MNEMONICS);
    const storedChain = localStorage.getItem(STORAGE_KEYS.CHAIN);
    console.log("storedWallets", storedWallets, "storedMnemonic", storedMnemonic, "storedChain", storedChain);
    if (storedWallets && storedMnemonic && storedChain) {
        const storedWalletData: StoredWalletData = {
            wallets: JSON.parse(storedWallets),
            mnemonics: JSON.parse(storedMnemonic),
            chain: JSON.parse(storedChain),
        };
        return storedWalletData;
    }
    return null;
}

/**
 * Saves wallet data to localStorage.
 * 
 * @param wallets - Array of wallet objects to persist
 * @param mnemonics - Array of mnemonic words to persist (optional)
 * @returns void
 * 
 * Usage:
 * - (wallets, mnemonics) to save both wallets and mnemonics for first time 
 * wallet addition
 * - (wallets) to save only wallets used for deleting wallets
 */
export function saveWalletsToStorage(
    wallets: Wallet[],
    mnemonics?: string[],
    chain?: string
): void {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));

    if (mnemonics) {
        localStorage.setItem(
            STORAGE_KEYS.MNEMONICS,
            JSON.stringify(mnemonics)
        );
    }

    if (chain) {
        localStorage.setItem(STORAGE_KEYS.CHAIN, JSON.stringify(chain));
    }
}

/**
 * Clears all wallet data from localStorage.
 */
export function clearWalletStorage(): void {
    localStorage.removeItem(STORAGE_KEYS.WALLETS);
    localStorage.removeItem(STORAGE_KEYS.MNEMONICS);
}
