"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MnemonicInputProps {
    mnemonicInput: string;
    onInputChange: (value: string) => void;
    onSubmit: () => void;
}

/**
 * Mnemonic input section with generate/import functionality.
 * Shows either "Generate Wallet" or "Add Wallet" based on input state.
 */
const MnemonicInput = ({ mnemonicInput, onInputChange, onSubmit }: MnemonicInputProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.3,
                ease: "easeInOut",
            }}
            className="flex flex-col gap-4 my-12"
        >
            <div className="flex flex-col gap-2">
                <h1 className="tracking-tighter text-4xl md:text-5xl font-black">
                    Secret Recovery Phrase
                </h1>
                <p className="text-primary/80 font-semibold text-lg md:text-xl">
                    Keep these words stored securely.
                </p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
                <Input
                    type="password"
                    placeholder="Enter your secret phrase (or leave blank to generate)"
                    onChange={(e) => onInputChange(e.target.value)}
                    value={mnemonicInput}
                />
                <Button size={"lg"} onClick={onSubmit}>
                    {mnemonicInput ? "Add Wallet" : "Generate Wallet"}
                </Button>
            </div>
        </motion.div>
    );
};

export default MnemonicInput;
