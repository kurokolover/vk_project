import { Crown, ListChecks, Plus, Radio } from "lucide-react";
import { HistoryPage } from "../History/HistoryPage";
import "./DashboardPage.css";

export function DashboardPage({ user, dashboard, setView }) {
  const stats = dashboard?.stats || { quizzes: 0, sessions: 0, wins: 0 };
  const metrics = [
    {
      label: user.role === "organizer" ? "Создано квизов" : "Участий",
      value: user.role === "organizer" ? stats.quizzes : stats.sessions,
      icon: ListChecks
    },
    { label: "Комнат в истории", value: stats.sessions, icon: Radio },
    { label: "Побед", value: stats.wins, icon: Crown }
  ];

  return (
    <section className="stack">
      <div className="metrics-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className="metric-card" key={metric.label}>
              <Icon size={22} />
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          );
        })}
      </div>

      <div className="action-band">
        <div>
          <p className="eyebrow">{user.role === "organizer" ? "Следующий шаг" : "Быстрое подключение"}</p>
          <h2>
            {user.role === "organizer"
              ? "Соберите квиз и запустите live-комнату"
              : "Введите код комнаты, когда организатор покажет его на экране"}
          </h2>
        </div>
        <button className="primary" onClick={() => setView(user.role === "organizer" ? "builder" : "room")}>
          {user.role === "organizer" ? <Plus size={18} /> : <Radio size={18} />}
          {user.role === "organizer" ? "Открыть конструктор" : "Подключиться"}
        </button>
      </div>

      <HistoryPage dashboard={dashboard} compact />
    </section>
  );
}
