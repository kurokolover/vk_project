import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import {
  BarChart3,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Crown,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Play,
  Plus,
  Radio,
  Save,
  Settings,
  Sparkles,
  Trophy,
  Users,
  X
} from "lucide-react";
import "./styles.css";

const API = "";
const emptyQuestion = () => ({
  id: crypto.randomUUID(),
  title: "",
  type: "text",
  imageUrl: "",
  choiceMode: "single",
  timeLimit: 30,
  points: 1000,
  options: [
    { id: crypto.randomUUID(), text: "", correct: true },
    { id: crypto.randomUUID(), text: "", correct: false }
  ]
});

const starterQuiz = {
  title: "VK Quiz Night",
  description: "Быстрый командный квиз для проверки MVP в реальном времени.",
  categories: "Frontend, WebSocket, Продукт",
  defaultTime: 30,
  rules: {
    shuffleQuestions: false,
    showCorrectAfterQuestion: true,
    speedBonus: true
  },
  questions: [
    {
      ...emptyQuestion(),
      title: "Какой протокол удобнее всего использовать для live-комнаты квиза?",
      options: [
        { id: crypto.randomUUID(), text: "WebSocket", correct: true },
        { id: crypto.randomUUID(), text: "Только HTML", correct: false },
        { id: crypto.randomUUID(), text: "CSV-файл", correct: false }
      ]
    },
    {
      ...emptyQuestion(),
      title: "Какие элементы входят в MVP этого проекта?",
      choiceMode: "multiple",
      options: [
        { id: crypto.randomUUID(), text: "Создание квиза", correct: true },
        { id: crypto.randomUUID(), text: "Подключение по коду", correct: true },
        { id: crypto.randomUUID(), text: "Лидерборд", correct: true },
        { id: crypto.randomUUID(), text: "3D-редактор видео", correct: false }
      ]
    }
  ]
};

function request(path, { token, method = "GET", body } = {}) {
  return fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Ошибка запроса");
    return data;
  });
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("quizhub_token") || "");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [toast, setToast] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [roomCode, setRoomCode] = useState("");

  useEffect(() => {
    if (!token) return;
    request("/api/me", { token })
      .then(({ user: me }) => setUser(me))
      .catch(() => logout());
  }, [token]);

  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user]);

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function persistSession(nextToken, nextUser) {
    localStorage.setItem("quizhub_token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem("quizhub_token");
    setToken("");
    setUser(null);
    setDashboard(null);
    setQuizzes([]);
    setRoomCode("");
  }

  async function refresh() {
    const [dash, list] = await Promise.all([
      request("/api/dashboard", { token }),
      user?.role === "organizer" ? request("/api/quizzes", { token }) : Promise.resolve({ quizzes: [] })
    ]);
    setDashboard(dash);
    setQuizzes(list.quizzes || []);
  }

  if (!user) {
    return <AuthScreen onAuth={persistSession} notify={notify} toast={toast} />;
  }

  const navItems = [
    { id: "dashboard", label: "Обзор", icon: LayoutDashboard },
    ...(user.role === "organizer" ? [{ id: "builder", label: "Конструктор", icon: Settings }] : []),
    { id: "room", label: "Комната", icon: Radio },
    { id: "history", label: "История", icon: History }
  ];

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
              <button className={view === item.id ? "active" : ""} key={item.id} onClick={() => setView(item.id)}>
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
          <button className="icon-btn" title="Выйти" onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Прототип квиз-платформы</p>
            <h1>{viewTitle(view, user.role)}</h1>
          </div>
          <button className="primary ghost" onClick={refresh}>
            <Sparkles size={18} />
            Обновить
          </button>
        </header>

        {view === "dashboard" && <Dashboard user={user} dashboard={dashboard} setView={setView} />}
        {view === "builder" && user.role === "organizer" && (
          <Builder token={token} quizzes={quizzes} setQuizzes={setQuizzes} setRoomCode={setRoomCode} setView={setView} notify={notify} refresh={refresh} />
        )}
        {view === "room" && <LiveRoom token={token} user={user} initialCode={roomCode} notify={notify} refresh={refresh} />}
        {view === "history" && <HistoryView dashboard={dashboard} />}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function viewTitle(view, role) {
  if (view === "builder") return "Конструктор квиза";
  if (view === "room") return "Live-комната";
  if (view === "history") return "История и результаты";
  return role === "organizer" ? "Кабинет организатора" : "Кабинет участника";
}

function AuthScreen({ onAuth, notify, toast }) {
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
      const data = await request(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
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
          <button className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>Вход</button>
          <button className={mode === "register" ? "selected" : ""} onClick={() => setMode("register")}>Регистрация</button>
        </div>
        <form onSubmit={submit} className="form-grid">
          {mode === "register" && (
            <label>
              Имя
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Алина" />
            </label>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@mail.ru" />
          </label>
          <label>
            Пароль
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Минимум 6 символов" />
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

function Dashboard({ user, dashboard, setView }) {
  const stats = dashboard?.stats || { quizzes: 0, sessions: 0, wins: 0 };
  const items = [
    { label: user.role === "organizer" ? "Создано квизов" : "Участий", value: user.role === "organizer" ? stats.quizzes : stats.sessions, icon: ListChecks },
    { label: "Комнат в истории", value: stats.sessions, icon: Radio },
    { label: "Побед", value: stats.wins, icon: Crown }
  ];

  return (
    <section className="stack">
      <div className="metrics-grid">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article className="metric-card" key={item.label}>
              <Icon size={22} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          );
        })}
      </div>
      <div className="action-band">
        <div>
          <p className="eyebrow">{user.role === "organizer" ? "Следующий шаг" : "Быстрое подключение"}</p>
          <h2>{user.role === "organizer" ? "Соберите квиз и запустите live-комнату" : "Введите код комнаты, когда организатор покажет его на экране"}</h2>
        </div>
        <button className="primary" onClick={() => setView(user.role === "organizer" ? "builder" : "room")}>
          {user.role === "organizer" ? <Plus size={18} /> : <Radio size={18} />}
          {user.role === "organizer" ? "Открыть конструктор" : "Подключиться"}
        </button>
      </div>
      <HistoryView dashboard={dashboard} compact />
    </section>
  );
}

function Builder({ token, quizzes, setQuizzes, setRoomCode, setView, notify, refresh }) {
  const [selectedId, setSelectedId] = useState(quizzes[0]?.id || "new");
  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedId);
  const [draft, setDraft] = useState(selectedQuiz || starterQuiz);

  useEffect(() => {
    const quiz = quizzes.find((item) => item.id === selectedId);
    setDraft(quiz || starterQuiz);
  }, [selectedId, quizzes]);

  function updateQuestion(questionId, patch) {
    setDraft({
      ...draft,
      questions: draft.questions.map((question) => (question.id === questionId ? { ...question, ...patch } : question))
    });
  }

  function updateOption(questionId, optionId, patch) {
    setDraft({
      ...draft,
      questions: draft.questions.map((question) => {
        if (question.id !== questionId) return question;
        const nextOptions = question.options.map((option) => (option.id === optionId ? { ...option, ...patch } : option));
        return { ...question, options: nextOptions };
      })
    });
  }

  function markCorrect(question, optionId) {
    const options = question.options.map((option) => {
      if (question.choiceMode === "single") return { ...option, correct: option.id === optionId };
      return option.id === optionId ? { ...option, correct: !option.correct } : option;
    });
    updateQuestion(question.id, { options });
  }

  async function save() {
    try {
      const data = await request(selectedQuiz ? `/api/quizzes/${selectedQuiz.id}` : "/api/quizzes", {
        token,
        method: selectedQuiz ? "PUT" : "POST",
        body: draft
      });
      const next = selectedQuiz ? quizzes.map((quiz) => (quiz.id === data.quiz.id ? data.quiz : quiz)) : [data.quiz, ...quizzes];
      setQuizzes(next);
      setSelectedId(data.quiz.id);
      notify("Квиз сохранён");
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function launch() {
    try {
      if (!selectedQuiz) {
        notify("Сначала сохраните квиз");
        return;
      }
      const data = await request(`/api/quizzes/${selectedQuiz.id}/launch`, { token, method: "POST" });
      setRoomCode(data.session.code);
      setView("room");
      notify(`Комната ${data.session.code} создана`);
    } catch (error) {
      notify(error.message);
    }
  }

  return (
    <section className="builder-layout">
      <aside className="quiz-list">
        <button className={selectedId === "new" ? "quiz-row active" : "quiz-row"} onClick={() => setSelectedId("new")}>
          <Plus size={18} />
          Новый квиз
        </button>
        {quizzes.map((quiz) => (
          <button className={selectedId === quiz.id ? "quiz-row active" : "quiz-row"} key={quiz.id} onClick={() => setSelectedId(quiz.id)}>
            <ListChecks size={18} />
            <span>{quiz.title}</span>
          </button>
        ))}
      </aside>

      <div className="builder-main">
        <section className="surface">
          <div className="section-head">
            <div>
              <p className="eyebrow">Настройки</p>
              <h2>{selectedQuiz ? "Редактирование квиза" : "Новый квиз"}</h2>
            </div>
            <div className="row-actions">
              <button className="secondary" onClick={save}>
                <Save size={18} />
                Сохранить
              </button>
              <button className="primary" onClick={launch}>
                <Play size={18} />
                Запустить
              </button>
            </div>
          </div>
          <div className="settings-grid">
            <label>
              Название
              <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </label>
            <label>
              Категории
              <input value={Array.isArray(draft.categories) ? draft.categories.join(", ") : draft.categories} onChange={(event) => setDraft({ ...draft, categories: event.target.value })} />
            </label>
            <label className="span-2">
              Описание
              <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={2} />
            </label>
          </div>
          <div className="rule-line">
            <label className="checkline">
              <input type="checkbox" checked={draft.rules?.showCorrectAfterQuestion !== false} onChange={(event) => setDraft({ ...draft, rules: { ...draft.rules, showCorrectAfterQuestion: event.target.checked } })} />
              Показывать правильный ответ после вопроса
            </label>
            <label className="checkline">
              <input type="checkbox" checked={draft.rules?.speedBonus !== false} onChange={(event) => setDraft({ ...draft, rules: { ...draft.rules, speedBonus: event.target.checked } })} />
              Бонус за скорость
            </label>
          </div>
        </section>

        <div className="question-stack">
          {draft.questions.map((question, index) => (
            <article className="question-card" key={question.id}>
              <div className="question-top">
                <strong>Вопрос {index + 1}</strong>
                <button className="icon-btn danger" title="Удалить вопрос" onClick={() => setDraft({ ...draft, questions: draft.questions.filter((item) => item.id !== question.id) })}>
                  <X size={16} />
                </button>
              </div>
              <label>
                Формулировка
                <input value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} />
              </label>
              <div className="settings-grid tight">
                <label>
                  Тип
                  <select value={question.type} onChange={(event) => updateQuestion(question.id, { type: event.target.value })}>
                    <option value="text">Текст</option>
                    <option value="image">Изображение</option>
                  </select>
                </label>
                <label>
                  Ответ
                  <select value={question.choiceMode} onChange={(event) => updateQuestion(question.id, { choiceMode: event.target.value })}>
                    <option value="single">Один вариант</option>
                    <option value="multiple">Несколько вариантов</option>
                  </select>
                </label>
                <label>
                  Секунды
                  <input type="number" min="10" max="180" value={question.timeLimit} onChange={(event) => updateQuestion(question.id, { timeLimit: Number(event.target.value) })} />
                </label>
                <label>
                  Баллы
                  <input type="number" min="100" max="5000" step="100" value={question.points} onChange={(event) => updateQuestion(question.id, { points: Number(event.target.value) })} />
                </label>
              </div>
              {question.type === "image" && (
                <label>
                  URL изображения
                  <input value={question.imageUrl} onChange={(event) => updateQuestion(question.id, { imageUrl: event.target.value })} placeholder="https://..." />
                </label>
              )}
              <div className="option-list">
                {question.options.map((option) => (
                  <div className="option-edit" key={option.id}>
                    <button className={option.correct ? "correct-toggle on" : "correct-toggle"} title="Правильный ответ" onClick={() => markCorrect(question, option.id)}>
                      <Check size={16} />
                    </button>
                    <input value={option.text} onChange={(event) => updateOption(question.id, option.id, { text: event.target.value })} placeholder="Вариант ответа" />
                    <button className="icon-btn" title="Удалить вариант" onClick={() => updateQuestion(question.id, { options: question.options.filter((item) => item.id !== option.id) })}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button className="secondary compact" onClick={() => updateQuestion(question.id, { options: [...question.options, { id: crypto.randomUUID(), text: "", correct: false }] })}>
                  <Plus size={16} />
                  Вариант
                </button>
              </div>
            </article>
          ))}
          <button className="add-question" onClick={() => setDraft({ ...draft, questions: [...draft.questions, emptyQuestion()] })}>
            <Plus size={18} />
            Добавить вопрос
          </button>
        </div>
      </div>
    </section>
  );
}

function LiveRoom({ token, user, initialCode, notify, refresh }) {
  const [code, setCode] = useState(initialCode || "");
  const [state, setState] = useState(null);
  const [selected, setSelected] = useState([]);
  const [socket, setSocket] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initialCode) setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    return () => socket?.disconnect();
  }, [socket]);

  useEffect(() => {
    setSelected([]);
  }, [state?.session?.currentQuestionIndex, state?.session?.status]);

  function joinRoom(targetCode = code) {
    const cleanCode = targetCode.trim().toUpperCase();
    if (!cleanCode) return notify("Введите код комнаты");
    socket?.disconnect();
    const nextSocket = io("/", { transports: ["websocket", "polling"] });
    nextSocket.on("room:update", (payload) => setState(payload));
    nextSocket.emit("room:join", { code: cleanCode, token }, (response) => {
      if (!response?.ok) {
        notify(response?.message || "Не удалось подключиться");
        nextSocket.disconnect();
        return;
      }
      setState(response.payload);
      setCode(cleanCode);
      refresh();
    });
    setSocket(nextSocket);
  }

  function emit(event, payload = {}) {
    socket?.emit(event, payload, (response) => {
      if (!response?.ok) notify(response?.message || "Команда не выполнена");
      refresh();
    });
  }

  function toggleOption(optionId) {
    const question = state?.question;
    if (!question) return;
    if (question.choiceMode === "single") {
      setSelected([optionId]);
      return;
    }
    setSelected((current) => (current.includes(optionId) ? current.filter((item) => item !== optionId) : [...current, optionId]));
  }

  const secondsLeft = state?.session?.questionEndsAt ? Math.max(0, Math.ceil((state.session.questionEndsAt - now) / 1000)) : 0;
  const canAnswer = user.role === "participant" && state?.session?.status === "active";

  return (
    <section className="room-grid">
      <div className="surface room-stage">
        <div className="join-line">
          <label>
            Код комнаты
            <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="A1B2C3" />
          </label>
          <button className="primary" onClick={() => joinRoom()}>
            <Radio size={18} />
            Подключиться
          </button>
        </div>

        {!state ? (
          <div className="empty-state">
            <Radio size={42} />
            <h2>Откройте активную комнату</h2>
            <p>Организатор запускает квиз из конструктора, участники входят по коду и видят вопрос синхронно.</p>
          </div>
        ) : (
          <div className="live-panel">
            <div className="live-head">
              <div>
                <p className="eyebrow">{state.quiz?.categories?.join(" / ") || "Live quiz"}</p>
                <h2>{state.quiz?.title}</h2>
              </div>
              <RoomBadge status={state.session.status} secondsLeft={secondsLeft} />
            </div>

            <div className="room-code">
              <span>{state.session.code}</span>
              <button className="icon-btn" title="Скопировать код" onClick={() => navigator.clipboard?.writeText(state.session.code)}>
                <Copy size={18} />
              </button>
            </div>

            {state.question ? (
              <article className="active-question">
                <div className="question-meta">
                  <span>
                    <Clock3 size={16} />
                    {state.question.timeLimit} сек
                  </span>
                  <span>
                    <Trophy size={16} />
                    {state.question.points} баллов
                  </span>
                  <span>
                    {state.question.choiceMode === "multiple" ? <ListChecks size={16} /> : <Check size={16} />}
                    {state.question.choiceMode === "multiple" ? "Несколько ответов" : "Один ответ"}
                  </span>
                </div>
                <h3>{state.question.title}</h3>
                {state.question.type === "image" && state.question.imageUrl && (
                  <img className="question-image" src={state.question.imageUrl} alt="" />
                )}
                <div className="answer-grid">
                  {state.question.options.map((option, index) => (
                    <button
                      className={[
                        "answer-btn",
                        selected.includes(option.id) ? "selected" : "",
                        option.correct === true ? "correct" : "",
                        option.correct === false && state.session.status !== "active" ? "muted" : ""
                      ].join(" ")}
                      key={option.id}
                      disabled={!canAnswer}
                      onClick={() => toggleOption(option.id)}
                    >
                      <span>{String.fromCharCode(65 + index)}</span>
                      {option.text}
                    </button>
                  ))}
                </div>
                {user.role === "participant" && (
                  <button className="primary wide" disabled={!canAnswer || selected.length === 0} onClick={() => emit("participant:answer", { optionIds: selected })}>
                    <Check size={18} />
                    Отправить ответ
                  </button>
                )}
              </article>
            ) : (
              <div className="empty-state small">
                <Play size={36} />
                <h2>Комната готова</h2>
                <p>Ждём участников и первый вопрос.</p>
              </div>
            )}

            {user.role === "organizer" && (
              <div className="host-controls">
                <button className="primary" onClick={() => emit("host:start")}>
                  <Play size={18} />
                  {state.session.currentQuestionIndex + 1 >= state.session.totalQuestions ? "Завершить" : "Следующий вопрос"}
                </button>
                <button className="secondary" onClick={() => emit("host:close")}>
                  <Clock3 size={18} />
                  Закрыть вопрос
                </button>
                <button className="secondary danger-text" onClick={() => emit("host:finish")}>
                  <Trophy size={18} />
                  Финал
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="surface live-aside">
        <div className="section-head compact-head">
          <div>
            <p className="eyebrow">Рейтинг</p>
            <h2>Лидерборд</h2>
          </div>
          <Users size={22} />
        </div>
        <Leaderboard rows={state?.session?.leaderboard || []} />
        <div className="participants">
          <p className="eyebrow">В комнате</p>
          {(state?.session?.participants || []).map((participant) => (
            <span key={participant.userId}>{participant.name}</span>
          ))}
          {!state?.session?.participants?.length && <small>Пока никого нет</small>}
        </div>
      </aside>
    </section>
  );
}

function RoomBadge({ status, secondsLeft }) {
  const labels = {
    waiting: "Ожидание",
    active: `${secondsLeft} сек`,
    review: "Разбор",
    finished: "Финал"
  };
  return <span className={`status-pill ${status}`}>{labels[status] || status}</span>;
}

function Leaderboard({ rows }) {
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

function HistoryView({ dashboard, compact }) {
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

createRoot(document.getElementById("root")).render(<App />);
