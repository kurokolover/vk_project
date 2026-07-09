import { History } from "lucide-react";
import "./HistoryPage.css";

export function HistoryPage({ dashboard, compact }) {
  const rows = dashboard?.history || [];

  return (
    <section className={compact ? "surface history compact-history" : "surface history"}>
      <div className="section-head compact-head">
        <div>
          <p className="eyebrow">Сохранённые данные</p>
          <h2>История квизов</h2>
        </div>
        <History size={22} />
      </div>

      {rows.length === 0 ? (
        <div className="empty-list">
          <History size={28} />
          <span>После запуска или участия здесь появятся комнаты и результаты</span>
        </div>
      ) : (
        <div className="history-table">
          {rows.map((row) => (
            <article key={row.id}>
              <div>
                <strong>{row.title}</strong>
                <small>{new Date(row.createdAt).toLocaleString("ru-RU")} · код {row.code}</small>
              </div>
              <span className={`status-pill ${row.status}`}>{row.status}</span>
              <b>{row.score ? `${row.score} очков` : `${row.participants} игроков`}</b>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
