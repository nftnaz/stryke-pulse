import { motion } from "motion/react";

type Props = {
  from: string;
  to: string;
};

export default function FlowCard({
  from,
  to,
}: Props) {
  return (
    <motion.div
      whileHover={{
        scale: 1.03,
      }}
      className="
        relative
        overflow-hidden
        rounded-xl
        border
        border-zinc-800
        bg-zinc-950
        px-4
        py-4
      "
    >
      <motion.div
        animate={{
          x: [-120, 260],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          absolute
          top-0
          h-full
          w-16
          bg-cyan-500/10
          blur-xl
        "
      />

      <div className="relative flex items-center">

        <span className="text-zinc-300">
          {from}
        </span>

        <motion.span
          animate={{
            x: [0, 8, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
          className="
            mx-3
            text-cyan-400
            font-bold
          "
        >
          →
        </motion.span>

        <span className="text-white">
          {to}
        </span>

      </div>
    </motion.div>
  );
}