import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { apiRequest } from "../../services/api";
import "./AuthPage.css";

export function AuthPage({ onAuth, notify, toast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "participant"
  });

  async function submit(event) {
    event.preventDefault();
    try {
      const data = await apiRequest(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        body: form
      });
      onAuth(data.token, data.user);
    } catch (error) {
      notify(error.message);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-art">
        <div className="live-chip">
          <span />
          Live quiz room
        </div>
        <h1>Квиз запускается за минуты, ответы летят в реальном времени.</h1>
        <p>Организатор собирает вопросы, открывает комнату по коду, участники отвечают только пока вопрос на экране.</p>
        <div className="auth-stats">
          <div>
            <strong>WebSocket</strong>
            <span>единое состояние комнаты</span>
          </div>
          <div>
            <strong>Баллы</strong>
            <span>точность и бонус скорости</span>
          </div>
          <div>
            <strong>История</strong>
            <span>результаты сохраняются</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="brand big">
          <span className="brand-mark">Q</span>
          <div>
            <strong>QuizHub Live</strong>
            <small>MVP для VK Project</small>
          </div>
        </div>

        <div className="segmented">
          <button className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>
            Вход
          </button>
          <button className={mode === "register" ? "selected" : ""} onClick={() => setMode("register")}>
            Регистрация
          </button>
        </div>

        <form onSubmit={submit} className="form-grid">
          {mode === "register" && (
            <label>
              Имя
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Алина"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@mail.ru"
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Минимум 6 символов"
            />
          </label>

          {mode === "register" && (
            <label>
              Роль
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <option value="participant">Участник</option>
                <option value="organizer">Организатор</option>
              </select>
            </label>
          )}

          <button className="primary wide" type="submit">
            <ChevronRight size={18} />
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
      </section>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
