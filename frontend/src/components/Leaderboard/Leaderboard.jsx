import { BarChart3 } from "lucide-react";
import "./Leaderboard.css";

export function Leaderboard({ rows }) {
  if (!rows.length) {
    return (
      <div className="empty-list">
        <BarChart3 size={28} />
        <span>Баллы появятся после ответов</span>
      </div>
    );
  }

  return (
    <ol className="leaderboard">
      {rows.map((row, index) => (
        <li key={row.id}>
          <span className="place">{index + 1}</span>
          <strong>{row.name}</strong>
          <small>{row.correctAnswers} верных</small>
          <b>{row.score}</b>
        </li>
      ))}
    </ol>
  );
}
