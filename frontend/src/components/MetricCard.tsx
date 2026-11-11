import { motion } from "motion/react";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export default function MetricCard({
  title,
  value,
  subtitle,
}: Props) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.4,
      }}
      whileHover={{
        scale: 1.02,
      }}
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900/50
        p-6
        cursor-pointer
        transition-all
        hover:border-cyan-500
        hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]
      "
    >
      <p className="text-zinc-500 text-sm">
        {title}
      </p>

      <motion.h2
        key={String(value)}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        className="text-4xl font-bold mt-3"
      >
        {value}
      </motion.h2>

      {subtitle && (
        <p className="text-cyan-400 mt-3 text-sm">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}