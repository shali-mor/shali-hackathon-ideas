"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const Hero3D = dynamic(() => import("./Hero3D").then((m) => m.Hero3D), {
  ssr: false,
  loading: () => null,
});

type Props = {
  children: React.ReactNode;
};

export function HeroClient({ children }: Props) {
  return (
    <section className="relative isolate grid md:grid-cols-[1.1fr_1fr] items-center gap-8 min-h-[70vh] py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative z-10"
      >
        {children}
      </motion.div>

      <div
        aria-hidden
        className="relative h-[44vh] md:h-[60vh] pointer-events-none order-first md:order-none"
      >
        <Hero3D />
      </div>
    </section>
  );
}
