import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  AlertTriangle,
  Check,
  Clock3,
  Copy,
  Crown,
  ListChecks,
  LogOut,
  Play,
  Radio,
  Send,
  Trophy,
  Users
} from "lucide-react";
import { Leaderboard } from "../../components/Leaderboard/Leaderboard";
import { RoomBadge } from "../../components/RoomBadge/RoomBadge";
import "./LiveRoomPage.css";

export function LiveRoomPage({ token, user, initialCode, notify, refresh }) {
  const [code, setCode] = useState(initialCode || "");
  const [state, setState] = useState(null);
  const [selected, setSelected] = useState([]);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
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
    setAnswerSubmitted(false);
  }, [state?.session?.currentQuestionIndex, state?.session?.status]);

  useEffect(() => {
    if (user.role === "participant" && state?.session?.status === "finished") {
      setFinishModalOpen(true);
    }
  }, [state?.session?.status, user.role]);

  function joinRoom(targetCode = code) {
    const cleanCode = targetCode.trim().toUpperCase();
    if (!cleanCode) {
      notify("Введите код комнаты");
      return;
    }

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
      setFinishModalOpen(false);
      setLeaveConfirmOpen(false);
      refresh();
    });
    setSocket(nextSocket);
  }

  function leaveRoom() {
    socket?.disconnect();
    setSocket(null);
    setState(null);
    setSelected([]);
    setAnswerSubmitted(false);
    setFinishModalOpen(false);
    setLeaveConfirmOpen(false);
    setCode("");
    refresh();
  }

  function requestLeaveRoom() {
    if (!state) return;
    if (state.session.status === "finished") {
      leaveRoom();
      return;
    }
    setLeaveConfirmOpen(true);
  }

  function emit(event, payload = {}) {
    socket?.emit(event, payload, (response) => {
      if (!response?.ok) notify(response?.message || "Команда не выполнена");
      refresh();
    });
  }

  function submitAnswer() {
    socket?.emit("participant:answer", { optionIds: selected }, (response) => {
      if (!response?.ok) {
        notify(response?.message || "Ответ не отправлен");
        return;
      }
      setAnswerSubmitted(true);
      notify("Ответ принят");
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

    setSelected((current) =>
      current.includes(optionId) ? current.filter((item) => item !== optionId) : [...current, optionId]
    );
  }

  const secondsLeft = state?.session?.questionEndsAt
    ? Math.max(0, Math.ceil((state.session.questionEndsAt - now) / 1000))
    : 0;
  const canAnswer = user.role === "participant" && state?.session?.status === "active";
  const timeProgress = state?.question?.timeLimit
    ? Math.max(0, Math.min(100, (secondsLeft / state.question.timeLimit) * 100))
    : 0;
  const participantsCount = state?.session?.participants?.length || 0;
  const answeredCount = state?.session?.answeredCurrentQuestion || 0;
  const winner = state?.session?.leaderboard?.[0];

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
              <div className="room-actions">
                <RoomBadge status={state.session.status} secondsLeft={secondsLeft} />
                <button className="secondary compact" onClick={requestLeaveRoom}>
                  <LogOut size={16} />
                  Выйти
                </button>
              </div>
            </div>

            <div className="room-code">
              <span>{state.session.code}</span>
              <button
                className="icon-btn"
                title="Скопировать код"
                onClick={() => {
                  navigator.clipboard?.writeText(state.session.code);
                  notify("Код комнаты скопирован");
                }}
              >
                <Copy size={18} />
              </button>
            </div>

            <div className="room-progress">
              <div>
                <span style={{ width: `${timeProgress}%` }} />
              </div>
              <strong>{answeredCount}/{participantsCount} ответили</strong>
            </div>

            {state.session.status === "finished" && (
              <div className="winner-panel">
                <Crown size={34} />
                <div>
                  <p className="eyebrow">Победитель</p>
                  <h3>{winner ? winner.name : "Пока нет участников"}</h3>
                  <span>{winner ? `${winner.score} баллов · ${winner.correctAnswers} верных` : "Запустите комнату с участниками"}</span>
                </div>
              </div>
            )}

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
                      disabled={!canAnswer || answerSubmitted}
                      onClick={() => toggleOption(option.id)}
                    >
                      <span>{String.fromCharCode(65 + index)}</span>
                      {option.text}
                    </button>
                  ))}
                </div>

                {user.role === "participant" && (
                  <button
                    className="primary wide"
                    disabled={!canAnswer || selected.length === 0 || answerSubmitted}
                    onClick={submitAnswer}
                  >
                    {answerSubmitted ? <Check size={18} /> : <Send size={18} />}
                    {answerSubmitted ? "Ответ отправлен" : "Отправить ответ"}
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

      {finishModalOpen && user.role === "participant" && (
        <div className="room-modal" role="dialog" aria-modal="true" aria-labelledby="finish-title">
          <div className="room-modal-card">
            <Crown size={38} />
            <p className="eyebrow">Квиз завершён</p>
            <h2 id="finish-title">Спасибо за игру!</h2>
            <p>
              {winner
                ? `Победитель: ${winner.name}. Ваш результат уже сохранён в истории.`
                : "Результаты сохранены в истории участия."}
            </p>
            <button className="primary wide" onClick={leaveRoom}>
              <LogOut size={18} />
              Выйти из комнаты
            </button>
          </div>
        </div>
      )}

      {leaveConfirmOpen && (
        <div className="room-modal" role="dialog" aria-modal="true" aria-labelledby="leave-title">
          <div className="room-modal-card">
            <AlertTriangle size={38} />
            <p className="eyebrow">Выход из комнаты</p>
            <h2 id="leave-title">Вы точно хотите покинуть квиз?</h2>
            <p>Если вопрос сейчас открыт, выбранный ответ не будет отправлен после выхода.</p>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setLeaveConfirmOpen(false)}>
                Остаться
              </button>
              <button className="primary" onClick={leaveRoom}>
                <LogOut size={18} />
                Покинуть
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
