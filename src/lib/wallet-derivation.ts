/**
 * Pure wallet derivation logic.
 * 
 * SECURITY INVARIANTS (from SECURITY.md):
 * - No network transmission of key material
 * - No console logging of secrets
 * - Mnemonic validation is caller's responsibility
 * 
 * This module is intentionally pure (no React, no side effects)
 * to facilitate testing and maintain separation of concerns.
 */

import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import nacl from "tweetnacl";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { ethers } from "ethers";
import { Wallet } from "./wallet-types";

/**
 * Error thrown when an unsupported path type is provided.
 */
export class UnsupportedPathTypeError extends Error {
    constructor(pathType: string) {
        super(`Unsupported path type: ${pathType}`);
        this.name = "UnsupportedPathTypeError";
    }
}

/**
 * Error thrown when wallet derivation fails.
 */
export class WalletDerivationError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = "WalletDerivationError";
    }
}

/**
 * Generates a wallet from a mnemonic phrase using BIP44 HD derivation.
 * 
 * @param pathType - The BIP44 coin type ("501" for Solana, "60" for Ethereum)
 * @param mnemonic - A valid BIP39 mnemonic phrase (must be pre-validated by caller)
 * @param accountIndex - The account index for derivation path
 * @returns The generated Wallet object
 * @throws {UnsupportedPathTypeError} If pathType is not "501" or "60"
 * @throws {WalletDerivationError} If derivation fails for any other reason
 * 
 * SECURITY: Caller MUST validate mnemonic with bip39.validateMnemonic() before calling.
 */
export function generateWalletFromMnemonic(
    pathType: string,
    mnemonic: string,
    accountIndex: number
): Wallet {
    try {
        const seedBuffer = mnemonicToSeedSync(mnemonic);
        const path = `m/44'/${pathType}'/0'/${accountIndex}'`;
        const { key: derivedSeed } = derivePath(path, seedBuffer.toString("hex"));

        let publicKeyEncoded: string;
        let privateKeyEncoded: string;

        if (pathType === "501") {
            // Solana derivation
            const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
            const keypair = Keypair.fromSecretKey(secretKey);

            privateKeyEncoded = bs58.encode(secretKey);
            publicKeyEncoded = keypair.publicKey.toBase58();
        } else if (pathType === "60") {
            // Ethereum derivation
            const privateKey = Buffer.from(derivedSeed).toString("hex");
            privateKeyEncoded = privateKey;

            const wallet = new ethers.Wallet(privateKey);
            publicKeyEncoded = wallet.address;
        } else {
            throw new UnsupportedPathTypeError(pathType);
        }

        return {
            publicKey: publicKeyEncoded,
            privateKey: privateKeyEncoded,
            path,
        };
    } catch (error) {
        if (error instanceof UnsupportedPathTypeError) {
            throw error;
        }
        throw new WalletDerivationError(
            "Failed to generate wallet",
            error
        );
    }
}
