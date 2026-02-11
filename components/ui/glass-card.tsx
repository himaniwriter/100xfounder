"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type GlassCardProps = HTMLMotionProps<"div">;

export function GlassCard({ className, children, ...props }: GlassCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:border-white/20",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
