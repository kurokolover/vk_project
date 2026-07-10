// @ts-check
import { ArrowRight, CheckCircle2 } from "lucide-react";

/**
 * @typedef {import("../dashboardContent").MvpItem} MvpItem
 */

/**
 * @param {{
 *   items: MvpItem[],
 *   activeId: string,
 *   onActiveChange: (id: string) => void,
 *   onOpenActive: (id: string) => void
 * }} props
 */
export function MvpConsole({ items, activeId, onActiveChange, onOpenActive }) {
  const activeItem = items.find((item) => item.id === activeId) || items[0];

  return (
    <section className="mvp-console">
      <div className="mvp-copy">
        <p className="eyebrow">MVP покрытие</p>
        <h2>Базовые требования проекта собраны в одном интерактивном чеклисте</h2>
        <p>Нажимайте на пункты, чтобы увидеть, какую часть сценария закрывает прототип.</p>
      </div>

      <div className="mvp-board">
        <div className="mvp-tabs">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button className={activeId === item.id ? "active" : ""} key={item.id} onClick={() => onActiveChange(item.id)}>
                <Icon size={16} />
                {item.title}
              </button>
            );
          })}
        </div>

        <article className="mvp-detail">
          <CheckCircle2 size={30} />
          <strong>{activeItem.title}</strong>
          <p>{activeItem.text}</p>
          <button className="guide-link" onClick={() => onOpenActive(activeItem.id)}>
            Открыть раздел
            <ArrowRight size={15} />
          </button>
        </article>
      </div>
    </section>
  );
}
