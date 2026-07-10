// @ts-check
import { ArrowRight } from "lucide-react";

/**
 * @typedef {import("../dashboardContent").FlowStep} FlowStep
 */

/**
 * @param {{
 *   flow: FlowStep[],
 *   onOpenStep: (index: number) => void
 * }} props
 */
export function FlowGuide({ flow, onOpenStep }) {
  return (
    <div className="guide-grid">
      {flow.map((item, index) => {
        const Icon = item.icon;
        return (
          <article className="guide-card" key={item.title}>
            <div>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <Icon size={20} />
            </div>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
            <button className="guide-link" onClick={() => onOpenStep(index)}>
              Перейти
              <ArrowRight size={15} />
            </button>
          </article>
        );
      })}
    </div>
  );
}
