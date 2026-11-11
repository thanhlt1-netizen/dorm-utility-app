"use client";

import { AnimatePresence, motion } from "framer-motion";

export function SuccessOverlay({
  open,
  title,
  message,
}: {
  open: boolean;
  title: string;
  message?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="mx-6 flex w-full max-w-xs flex-col items-center rounded-3xl bg-card p-8 text-center shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
              className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15"
            >
              <svg viewBox="0 0 52 52" className="size-12">
                <motion.circle
                  cx="26"
                  cy="26"
                  r="24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: "easeInOut" }}
                />
                <motion.path
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 27l8 8 16-16"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.55, ease: "easeOut" }}
                />
              </svg>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-5 text-lg font-bold text-foreground"
            >
              {title}
            </motion.h2>
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.62 }}
                className="mt-1.5 text-sm text-muted-foreground"
              >
                {message}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
