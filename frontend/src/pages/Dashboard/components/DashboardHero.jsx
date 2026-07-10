// @ts-check
import { ArrowRight, Plus } from "lucide-react";

/**
 * @typedef {import("../dashboardContent").UserRole} UserRole
 */

/**
 * @param {{
 *   role: UserRole,
 *   quickCode: string,
 *   onQuickCodeChange: (code: string) => void,
 *   onJoinByCode: () => void,
 *   onCreateQuiz: () => void
 * }} props
 */
export function DashboardHero({ role, quickCode, onQuickCodeChange, onJoinByCode, onCreateQuiz }) {
  const isOrganizer = role === "organizer";

  return (
    <article className="action-band dashboard-hero">
      <div>
        <p className="eyebrow">{isOrganizer ? "Пульт запуска" : "Быстрый вход"}</p>
        <h2>
          {isOrganizer
            ? "Выберите готовый квиз и откройте live-комнату за один клик"
            : "Введите код комнаты и сразу переходите к прохождению квиза"}
        </h2>
      </div>

      {isOrganizer ? (
        <button className="primary" onClick={onCreateQuiz}>
          <Plus size={18} />
          Создать свой квиз
        </button>
      ) : (
        <div className="quick-code">
          <input
            value={quickCode}
            onChange={(event) => onQuickCodeChange(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter") onJoinByCode();
            }}
            placeholder="A1B2C3"
          />
          <button className="primary" onClick={onJoinByCode}>
            <ArrowRight size={18} />
            Войти
          </button>
        </div>
      )}
    </article>
  );
}
