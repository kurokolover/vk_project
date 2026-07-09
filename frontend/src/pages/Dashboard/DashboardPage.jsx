import { ArrowUpRight, Crown, ListChecks, Play, Plus, Radio, Save, UsersRound } from "lucide-react";
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
  const guide =
    user.role === "organizer"
      ? [
          { title: "Соберите вопросы", text: "Название, категории, время, баллы и варианты ответов.", icon: ListChecks },
          { title: "Запустите комнату", text: "Система создаст код для подключения участников.", icon: Play },
          { title: "Сохраните итоги", text: "Лидерборд попадет в историю после финала.", icon: Save }
        ]
      : [
          { title: "Получите код", text: "Организатор покажет код комнаты перед стартом.", icon: Radio },
          { title: "Отвечайте в эфире", text: "Ответ доступен только пока вопрос открыт.", icon: UsersRound },
          { title: "Смотрите место", text: "После финала появится общий лидерборд.", icon: Crown }
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

      <div className="guide-grid">
        {guide.map((item, index) => {
          const Icon = item.icon;
          return (
            <article className="guide-card" key={item.title}>
              <div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon size={20} />
              </div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
              <button
                className="guide-link"
                onClick={() => setView(user.role === "organizer" && index === 0 ? "builder" : "room")}
              >
                Перейти
                <ArrowUpRight size={15} />
              </button>
            </article>
          );
        })}
      </div>

      <HistoryPage dashboard={dashboard} compact />
    </section>
  );
}
