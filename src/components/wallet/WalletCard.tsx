"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash } from "lucide-react";
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
import { Wallet } from "@/lib/wallet-types";

interface WalletCardProps {
    wallet: Wallet;
    index: number;
    isPrivateKeyVisible: boolean;
    onTogglePrivateKey: () => void;
    onDelete: () => void;
    onCopyPublicKey: () => void;
    onCopyPrivateKey: () => void;
}

/**
 * Individual wallet card displaying public/private keys.
 * 
 * SECURITY INVARIANTS:
 * - Private key is hidden by default (controlled by parent)
 * - Delete action requires confirmation via AlertDialog
 */
const WalletCard = ({
    wallet,
    index,
    isPrivateKeyVisible,
    onTogglePrivateKey,
    onDelete,
    onCopyPublicKey,
    onCopyPrivateKey,
}: WalletCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: 0.3 + index * 0.1,
                duration: 0.3,
                ease: "easeInOut",
            }}
            className="flex flex-col rounded-2xl border border-primary/10"
        >
            <div className="flex justify-between px-8 py-6">
                <h3 className="font-bold text-2xl md:text-3xl tracking-tighter ">
                    Wallet {index + 1}
                </h3>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex gap-2 items-center"
                        >
                            <Trash className="size-4 text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Are you sure you want to delete this wallet?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently
                                delete your wallet and keys from local storage.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={onDelete}
                                className="text-destructive"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <div className="flex flex-col gap-8 px-8 py-4 rounded-2xl bg-secondary/50">
                <div
                    className="flex flex-col w-full gap-2"
                    onClick={onCopyPublicKey}
                >
                    <span className="text-lg md:text-xl font-bold tracking-tighter">
                        Public Key
                    </span>
                    <p className="text-primary/80 font-medium cursor-pointer hover:text-primary transition-all duration-300 truncate">
                        {wallet.publicKey}
                    </p>
                </div>
                <div className="flex flex-col w-full gap-2">
                    <span className="text-lg md:text-xl font-bold tracking-tighter">
                        Private Key
                    </span>
                    <div className="flex justify-between w-full items-center gap-2">
                        <p
                            onClick={onCopyPrivateKey}
                            className="text-primary/80 font-medium cursor-pointer hover:text-primary transition-all duration-300 truncate"
                        >
                            {isPrivateKeyVisible
                                ? wallet.privateKey
                                : "•".repeat(wallet.privateKey.length)}
                        </p>
                        <Button
                            variant="ghost"
                            onClick={onTogglePrivateKey}
                        >
                            {isPrivateKeyVisible ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default WalletCard;
