import "./RoomBadge.css";

const statusLabels = {
  waiting: "Ожидание",
  review: "Разбор",
  finished: "Финал"
};

export function RoomBadge({ status, secondsLeft }) {
  const label = status === "active" ? `${secondsLeft} сек` : statusLabels[status] || status;
  return <span className={`status-pill ${status}`}>{label}</span>;
}
