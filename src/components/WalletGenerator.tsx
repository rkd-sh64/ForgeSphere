"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateMnemonic, validateMnemonic } from "bip39";
import { motion } from "framer-motion";
import { Grid2X2, List } from "lucide-react";
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
import { Wallet, PATH_TYPE_NAMES } from "@/lib/wallet-types";
import {
  generateWalletFromMnemonic,
  UnsupportedPathTypeError,
} from "@/lib/wallet-derivation";
import {
  loadWalletsFromStorage,
  saveWalletsToStorage,
  clearWalletStorage,
} from "@/lib/wallet-storage";
import ChainSelector from "@/components/wallet/ChainSelector";
import MnemonicInput from "@/components/wallet/MnemonicInput";
import MnemonicDisplay from "@/components/wallet/MnemonicDisplay";
import WalletCard from "@/components/wallet/WalletCard";

/**
 * WalletGenerator - Orchestrating component for HD wallet generation.
 * 
 * Responsibilities:
 * - State ownership for wallets, mnemonic, visibility, and UI preferences
 * - Coordination between UI subcomponents and wallet logic
 * - localStorage persistence (via wallet-storage module)
 * - User feedback via toast notifications
 * 
 * Security invariants enforced here:
 * - Mnemonic validation before derivation (SECURITY.md rule #3)
 * - Private keys hidden by default (SECURITY.md rule #5)
 * - Confirmation dialogs for destructive actions (SECURITY.md rule #4)
 */
const WalletGenerator = () => {
  // Core wallet state
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(
    Array(12).fill(" ")
  );
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [chain, setChain] = useState<string>("");

  // UI state
  const [showMnemonic, setShowMnemonic] = useState<boolean>(false);
  const [mnemonicInput, setMnemonicInput] = useState<string>("");
  const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([]);
  const [visiblePhrases, setVisiblePhrases] = useState<boolean[]>([]);
  const [gridView, setGridView] = useState<boolean>(false);

  const { toast } = useToast();

  const pathTypeName = PATH_TYPE_NAMES[chain] || "";

  // Hydrate state from localStorage on mount
  useEffect(() => {
    const storedData = loadWalletsFromStorage();
    if (storedData) {
      setMnemonicWords(storedData.mnemonics);
      setWallets(storedData.wallets);
      setVisiblePrivateKeys(storedData.wallets.map(() => false));
      setVisiblePhrases(storedData.wallets.map(() => false));
      setChain(storedData.chain);
    }
  }, []);

  /**
   * Handles chain selection from ChainSelector component.
   */
  const handleSelectChain = (pathType: string) => {
    setChain(pathType);
    toast({
      description: "Wallet selected. Please generate a wallet to continue.",
    });
  };

  /**
   * Deletes a wallet at the specified index.
   * Requires prior user confirmation via AlertDialog in WalletCard.
   */
  const handleDeleteWallet = (index: number) => {
    const updatedWallets = wallets.filter((_, i) => i !== index);

    setWallets(updatedWallets);
    saveWalletsToStorage(updatedWallets);
    setVisiblePrivateKeys(visiblePrivateKeys.filter((_, i) => i !== index));
    setVisiblePhrases(visiblePhrases.filter((_, i) => i !== index));
    toast({
      description: "Wallet deleted successfully!",
    });
  };

  /**
   * Clears all wallets and resets state.
   * Requires prior user confirmation via AlertDialog.
   */
  const handleClearWallets = () => {
    clearWalletStorage();
    setWallets([]);
    setMnemonicWords([]);
    setVisiblePrivateKeys([]);
    setVisiblePhrases([]);
    toast({
      description: "All wallets cleared.",
    });
  };

  /**
   * Copies content to clipboard and shows feedback toast.
   */
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      description: "Copied to clipboard!",
    });
  };

  /**
   * Toggles private key visibility for wallet at index.
   */
  const togglePrivateKeyVisibility = (index: number) => {
    setVisiblePrivateKeys(
      visiblePrivateKeys.map((visible, i) => (i === index ? !visible : visible))
    );
  };

  /**
   * Generates initial wallet (with optional imported mnemonic) or
   * generates a new mnemonic if input is empty.
   * 
   * SECURITY: Validates mnemonic with bip39 before derivation.
   */
  const handleGenerateWallet = () => {
    let mnemonic = mnemonicInput.trim();

    if (mnemonic) {
      // SECURITY: Mandatory validation per SECURITY.md rule #3
      if (!validateMnemonic(mnemonic)) {
        toast({
          description: "Invalid recovery phrase. Please try again.",
          variant: "destructive",
        });
        return;
      }
    } else {
      mnemonic = generateMnemonic();
    }

    const words = mnemonic.split(" ");
    setMnemonicWords(words);

    try {
      const wallet = generateWalletFromMnemonic(
        chain,
        mnemonic,
        wallets.length
      );

      const updatedWallets = [...wallets, wallet];
      setWallets(updatedWallets);
      saveWalletsToStorage(updatedWallets, words, chain);
      setVisiblePrivateKeys([...visiblePrivateKeys, false]);
      setVisiblePhrases([...visiblePhrases, false]);
      toast({
        description: "Wallet generated successfully!",
      });
    } catch (error) {
      if (error instanceof UnsupportedPathTypeError) {
        toast({
          description: "Unsupported path type.",
          variant: "destructive",
        });
      } else {
        toast({
          description: `Failed to generate wallet due to ${error}. Please try again.`,
          variant: "destructive",
        });
      }
    }
  };

  /**
   * Adds an additional wallet using the existing mnemonic.
   */
  const handleAddWallet = () => {
    if (!mnemonicWords || mnemonicWords.length === 0 || mnemonicWords[0] === " ") {
      toast({
        description: "No mnemonic found. Please generate a wallet first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const wallet = generateWalletFromMnemonic(
        chain,
        mnemonicWords.join(" "),
        wallets.length
      );

      const updatedWallets = [...wallets, wallet];
      setWallets(updatedWallets);
      saveWalletsToStorage(updatedWallets);
      setVisiblePrivateKeys([...visiblePrivateKeys, false]);
      setVisiblePhrases([...visiblePhrases, false]);
      toast({
        description: "Wallet generated successfully!",
      });
    } catch (error) {
      if (error instanceof UnsupportedPathTypeError) {
        toast({
          description: "Unsupported path type.",
          variant: "destructive",
        });
      } else {
        toast({
          description: `Failed to generate wallet due to ${error}. Please try again.`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="w-[80%] flex flex-col gap-4">
      {/* Initial setup flow (no wallets yet) */}
      {wallets.length === 0 && (
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
        >
          <div className="flex flex-col gap-4">
            {/* Chain selection */}
            {chain === "" && (
              <ChainSelector onSelectChain={handleSelectChain} />
            )}

            {/* Mnemonic input */}
            {chain !== "" && (
              <MnemonicInput
                mnemonicInput={mnemonicInput}
                onInputChange={setMnemonicInput}
                onSubmit={handleGenerateWallet}
              />
            )}
          </div>
        </motion.div>
      )}

      {/* Display Secret Phrase */}
      {mnemonicWords && wallets.length > 0 && (
        <MnemonicDisplay
          mnemonicWords={mnemonicWords}
          isExpanded={showMnemonic}
          onToggleExpand={() => setShowMnemonic(!showMnemonic)}
          onCopy={() => copyToClipboard(mnemonicWords.join(" "))}
        />
      )}

      {/* Display wallet list */}
      {wallets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="flex flex-col gap-8 mt-6"
        >
          {/* Header with actions */}
          <div className="flex md:flex-row flex-col justify-between w-full gap-4 md:items-center">
            <h2 className="tracking-tighter text-3xl md:text-4xl font-extrabold">
              {pathTypeName} Wallet
            </h2>
            <div className="flex gap-2">
              {wallets.length > 1 && (
                <Button
                  variant={"ghost"}
                  onClick={() => setGridView(!gridView)}
                  className="hidden md:block"
                >
                  {gridView ? <Grid2X2 /> : <List />}
                </Button>
              )}
              <Button onClick={() => handleAddWallet()}>Add Wallet</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="self-end">
                    Clear Wallets
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to delete all wallets?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your wallets and keys from local storage.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleClearWallets()}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Wallet cards grid/list */}
          <div
            className={`grid gap-6 grid-cols-1 col-span-1  ${gridView ? "md:grid-cols-2 lg:grid-cols-3" : ""
              }`}
          >
            {wallets.map((wallet: Wallet, index: number) => (
              <WalletCard
                key={index}
                wallet={wallet}
                index={index}
                isPrivateKeyVisible={visiblePrivateKeys[index] || false}
                onTogglePrivateKey={() => togglePrivateKeyVisibility(index)}
                onDelete={() => handleDeleteWallet(index)}
                onCopyPublicKey={() => copyToClipboard(wallet.publicKey)}
                onCopyPrivateKey={() => copyToClipboard(wallet.privateKey)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WalletGenerator;