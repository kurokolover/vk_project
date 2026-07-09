import { useState } from "react";
import { ArrowUpRight, ChevronRight, KeyRound, Radio, Sparkles, UserRoundCog, UsersRound } from "lucide-react";
import { apiRequest } from "../../services/api";
import "./AuthPage.css";

const routes = [
  {
    role: "participant",
    icon: UsersRound,
    title: "Я участник",
    text: "Вхожу в комнату по коду и отвечаю на вопросы в прямом эфире.",
    action: "Стать участником"
  },
  {
    role: "organizer",
    icon: UserRoundCog,
    title: "Я организатор",
    text: "Создаю квиз, запускаю комнату и веду участников по вопросам.",
    action: "Стать организатором"
  }
];

const flow = [
  { value: "01", label: "Квиз" },
  { value: "02", label: "Комната" },
  { value: "03", label: "Лидерборд" }
];

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
    if (mode === "register" && String(form.password || "").length < 6) {
      notify("Пароль должен быть минимум 6 символов");
      return;
    }

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

  function chooseRoute(role) {
    setMode("register");
    setForm((current) => ({ ...current, role }));
  }

  return (
    <main className="auth-layout">
      <section className="auth-art">
        <nav className="auth-nav" aria-label="Основные сценарии">
          <div className="brand compact">
            <span className="brand-mark">Q</span>
            <strong>QuizHub Live</strong>
          </div>
          <button onClick={() => chooseRoute("participant")}>Участнику</button>
          <button onClick={() => chooseRoute("organizer")}>Организатору</button>
          <button onClick={() => setMode("login")}>Войти</button>
        </nav>

        <div className="auth-hero">
          <div className="auth-copy">
            <div className="live-chip">
              <span />
              Live quiz room
            </div>
            <h1>Запускайте квизы, где каждый сразу понимает свой следующий шаг.</h1>
            <p>Участник входит по коду комнаты. Организатор собирает вопросы, открывает эфир и видит ответы в реальном времени.</p>

            <div className="route-grid" aria-label="Выбор роли">
              {routes.map((route) => {
                const Icon = route.icon;
                const active = mode === "register" && form.role === route.role;
                return (
                  <button
                    className={active ? "route-card active" : "route-card"}
                    key={route.role}
                    onClick={() => chooseRoute(route.role)}
                    type="button"
                  >
                    <Icon size={22} />
                    <strong>{route.title}</strong>
                    <span>{route.text}</span>
                    <small>
                      {route.action}
                      <ArrowUpRight size={14} />
                    </small>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="room-preview" aria-label="Пример live-комнаты">
            <div className="preview-top">
              <span>ROOM</span>
              <strong>A1B2C3</strong>
            </div>
            <div className="preview-question">
              <p>Вопрос на экране</p>
              <strong>Какая планета известна как Красная?</strong>
            </div>
            <div className="preview-options">
              <span className="picked">A. Марс</span>
              <span>B. Венера</span>
              <span>C. Юпитер</span>
            </div>
            <div className="preview-footer">
              <div>
                <UsersRound size={16} />
                24 участника
              </div>
              <div>
                <Sparkles size={16} />
                live
              </div>
            </div>
          </aside>
        </div>

        <div className="auth-flow">
          {flow.map((item) => (
            <div key={item.value}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-panel">
        <div className="brand big">
          <span className="brand-mark">Q</span>
          <div>
            <strong>{mode === "login" ? "Вход в кабинет" : "Новый аккаунт"}</strong>
            <small>{mode === "login" ? "Продолжите работу с квизами" : "Выберите роль и начните сценарий"}</small>
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

        {mode === "register" && (
          <div className="role-switch" aria-label="Роль аккаунта">
            {routes.map((route) => {
              const Icon = route.icon;
              return (
                <button
                  className={form.role === route.role ? "selected" : ""}
                  key={route.role}
                  onClick={() => setForm({ ...form, role: route.role })}
                  type="button"
                >
                  <Icon size={18} />
                  <span>{route.title}</span>
                </button>
              );
            })}
          </div>
        )}

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
              minLength={mode === "register" ? 6 : undefined}
              required
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Минимум 6 символов"
            />
          </label>

          {mode === "register" && (
            <div className="selected-route">
              <KeyRound size={18} />
              <span>
                {form.role === "organizer"
                  ? "После регистрации откроется кабинет организатора с конструктором."
                  : "После регистрации откроется кабинет участника с входом по коду комнаты."}
              </span>
            </div>
          )}

          <button className="primary wide" type="submit">
            {mode === "login" ? <Radio size={18} /> : <ChevronRight size={18} />}
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
      </section>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
