import { CostCalculator } from "../components/CostCalculator";
import { CultivationCostAI } from "../components/CultivationCostAI";

export default function InputCosts() {
  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background max-w-4xl w-full min-w-0">
      <section>
        <h2 className="agri-section-header">Cultivation cost calculator (AI)</h2>
        <CultivationCostAI />
      </section>

      <section>
        <h2 className="agri-section-header">Manual cost entry</h2>
        <CostCalculator />
      </section>
    </div>
  );
}
