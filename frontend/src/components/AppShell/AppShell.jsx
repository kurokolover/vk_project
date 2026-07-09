import { History, LayoutDashboard, LogOut, Radio, Settings } from "lucide-react";
import "./AppShell.css";

const viewTitles = {
  builder: "Конструктор квиза",
  room: "Live-комната",
  history: "История и результаты"
};

export function AppShell({ user, view, onViewChange, onLogout, children }) {
  const navItems = [
    { id: "dashboard", label: "Обзор", icon: LayoutDashboard },
    ...(user.role === "organizer" ? [{ id: "builder", label: "Конструктор", icon: Settings }] : []),
    { id: "room", label: "Комната", icon: Radio },
    { id: "history", label: "История", icon: History }
  ];

  const title = viewTitles[view] || (user.role === "organizer" ? "Кабинет организатора" : "Кабинет участника");

  return (
    <div className="app-shell">
      <aside className="side">
        <div className="brand">
          <span className="brand-mark">Q</span>
          <div>
            <strong>QuizHub Live</strong>
            <small>real-time MVP</small>
          </div>
        </div>

        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={view === item.id ? "active" : ""}
                key={item.id}
                onClick={() => onViewChange(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="profile-mini">
          <span>{user.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role === "organizer" ? "Организатор" : "Участник"}</small>
          </div>
          <button className="icon-btn" title="Выйти" onClick={onLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Прототип квиз-платформы</p>
            <h1>{title}</h1>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
