import { motion } from "framer-motion";
import { statesData, getScoreColor, getRiskColor, StateData } from "@/data/statesData";
import { Trophy } from "lucide-react";

interface LeaderboardProps {
  onStateSelect: (state: StateData) => void;
}

const Leaderboard = ({ onStateSelect }: LeaderboardProps) => {
  const sorted = [...statesData].sort((a, b) => b.compositeScore - a.compositeScore).slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Governance Leaderboard</h3>
      </div>
      <div className="space-y-2">
        {sorted.map((state, i) => (
          <motion.div
            key={state.code}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
            onClick={() => onStateSelect(state)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
          >
            <span className={`w-6 text-center font-mono text-xs font-bold ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
              {i + 1}
            </span>
            <span className="text-sm text-foreground flex-1 group-hover:text-primary transition-colors">{state.name}</span>
            <span className={`font-mono text-xs font-bold ${getScoreColor(state.eps)}`}>{state.eps}</span>
            <span className="font-mono text-xs text-muted-foreground w-8 text-right">{state.compositeScore}</span>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between mt-3 text-xs text-muted-foreground px-2">
        <span></span>
        <div className="flex gap-6">
          <span>EPS</span>
          <span>Score</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Leaderboard;
