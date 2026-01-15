"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";

interface MnemonicDisplayProps {
    mnemonicWords: string[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onCopy: () => void;
}

/**
 * Collapsible display for the secret recovery phrase.
 * 
 * SECURITY: Private key material is displayed here.
 * The component is hidden by default (isExpanded=false).
 */
const MnemonicDisplay = ({
    mnemonicWords,
    isExpanded,
    onToggleExpand,
    onCopy,
}: MnemonicDisplayProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.3,
                ease: "easeInOut",
            }}
            className="group flex flex-col items-center gap-4 cursor-pointer rounded-lg border border-primary/10 p-8"
        >
            <div
                className="flex w-full justify-between items-center"
                onClick={onToggleExpand}
            >
                <h2 className="text-2xl md:text-3xl font-bold tracking-tighter">
                    Your Secret Phrase
                </h2>
                <Button onClick={onToggleExpand} variant="ghost">
                    {isExpanded ? (
                        <ChevronUp className="size-4" />
                    ) : (
                        <ChevronDown className="size-4" />
                    )}
                </Button>
            </div>

            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                    }}
                    className="flex flex-col w-full items-center justify-center"
                    onClick={onCopy}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                        }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 justify-center w-full items-center mx-auto my-8"
                    >
                        {mnemonicWords.map((word, index) => (
                            <p
                                key={index}
                                className="md:text-lg bg-foreground/5 hover:bg-foreground/10 transition-all duration-300 rounded-lg p-4"
                            >
                                {word}
                            </p>
                        ))}
                    </motion.div>
                    <div className="text-sm md:text-base text-primary/50 flex w-full gap-2 items-center group-hover:text-primary/80 transition-all duration-300">
                        <Copy className="size-4" /> Click Anywhere To Copy
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default MnemonicDisplay;
