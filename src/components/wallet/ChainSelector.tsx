"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ChainSelectorProps {
    onSelectChain: (pathType: string) => void;
}

/**
 * Initial chain selection UI with hero text.
 * Allows user to choose between Solana and Ethereum.
 */
const ChainSelector = ({ onSelectChain }: ChainSelectorProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.3,
                ease: "easeInOut",
            }}
            className="flex gap-4 flex-col my-12"
        >
            <div className="flex flex-col justify-center items-center gap-2">
                <h1 className="tracking-tighter text-4xl md:text-5xl font-black">
                    Effortless Wallet Creation for Solana &amp; Ethereum
                </h1>
                <p className="text-primary/80 font-semibold text-lg md:text-xl">
                    Generate secure public-private key pairs and manage your wallets with ease.
                </p>
            </div>
            <div className="flex justify-center items-center gap-2">
                <Button
                    size={"lg"}
                    onClick={() => onSelectChain("501")}
                >
                    Solana
                </Button>
                <Button
                    size={"lg"}
                    onClick={() => onSelectChain("60")}
                >
                    Ethereum
                </Button>
            </div>
        </motion.div>
    );
};

export default ChainSelector;
