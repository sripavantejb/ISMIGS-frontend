import { motion } from "framer-motion";
import { Construction } from "lucide-react";

const ComingSoon = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-12 text-center max-w-md"
    >
      <Construction className="w-12 h-12 text-primary mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground">
        This module is being built. API integration is ready — UI coming soon.
      </p>
    </motion.div>
  </div>
);

export default ComingSoon;
