"use client";

import * as React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

type OriginButtonProps = React.ComponentPropsWithoutRef<typeof motion.button>;

export const OriginButton = React.forwardRef<HTMLButtonElement, OriginButtonProps>(
  ({ className, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? undefined : { scale: 1.01 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "h-12 rounded-lg border-2 border-blue-600 bg-white px-4 text-base font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);

OriginButton.displayName = "OriginButton";
