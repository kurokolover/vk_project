import { buildLeaderboard, roomPayload } from "../quizzes/quizService.js";

export function createSessionService({ store, io }) {
  const roomTimers = new Map();

  async function closeQuestion(code) {
    const db = await store.read();
    const session = db.sessions.find((item) => item.code === code);
    if (!session || session.status !== "active") return;

    const quiz = db.quizzes.find((item) => item.id === session.quizId);
    const question = quiz?.questions[session.currentQuestionIndex];
    if (!question) return;

    const correctIds = question.options.filter((option) => option.correct).map((option) => option.id).sort();
    const answers = session.answers?.[question.id] || {};

    Object.entries(answers).forEach(([userId, answer]) => {
      const participant = session.participants[userId];
      if (!participant || answer.scored) return;

      const selected = [...answer.optionIds].sort();
      const isCorrect = selected.length === correctIds.length && selected.every((item, index) => item === correctIds[index]);
      const timeLimit = question.timeLimit * 1000;
      const elapsed = Math.max(0, answer.submittedAt - session.questionStartedAt);
      const speedBonus = quiz.rules.speedBonus ? Math.round(question.points * 0.25 * Math.max(0, 1 - elapsed / timeLimit)) : 0;

      participant.answered = (participant.answered || 0) + 1;
      if (isCorrect) {
        participant.score = (participant.score || 0) + question.points + speedBonus;
        participant.correctAnswers = (participant.correctAnswers || 0) + 1;
      }

      answer.scored = true;
      answer.correct = isCorrect;
    });

    session.status = quiz.rules.showCorrectAfterQuestion ? "review" : "waiting";
    session.questionEndsAt = Date.now();
    session.leaderboard = buildLeaderboard(session);

    await store.write(db);
    clearTimeout(roomTimers.get(code));
    roomTimers.delete(code);
    io.to(code).emit("room:update", roomPayload(session, db));
  }

  async function startQuestion(code, userId) {
    const db = await store.read();
    const session = db.sessions.find((item) => item.code === code);
    if (!session) throw new Error("Комната не найдена");
    if (session.organizerId !== userId) throw new Error("Только организатор может управлять комнатой");

    const quiz = db.quizzes.find((item) => item.id === session.quizId);
    const nextIndex = session.currentQuestionIndex + 1;
    if (!quiz || nextIndex >= quiz.questions.length) {
      session.status = "finished";
      session.finishedAt = new Date().toISOString();
      session.leaderboard = buildLeaderboard(session);
      await store.write(db);
      io.to(code).emit("room:update", roomPayload(session, db));
      return;
    }

    session.status = "active";
    session.currentQuestionIndex = nextIndex;
    session.questionStartedAt = Date.now();
    session.questionEndsAt = session.questionStartedAt + quiz.questions[nextIndex].timeLimit * 1000;
    session.answers[quiz.questions[nextIndex].id] = {};

    await store.write(db);
    clearTimeout(roomTimers.get(code));
    roomTimers.set(code, setTimeout(() => closeQuestion(code), quiz.questions[nextIndex].timeLimit * 1000));
    io.to(code).emit("room:update", roomPayload(session, db));
  }

  async function finishSession(code, userId) {
    const db = await store.read();
    const session = db.sessions.find((item) => item.code === code);
    if (!session || session.organizerId !== userId) throw new Error("Нет доступа к комнате");

    session.status = "finished";
    session.finishedAt = new Date().toISOString();
    session.leaderboard = buildLeaderboard(session);

    await store.write(db);
    clearTimeout(roomTimers.get(session.code));
    io.to(session.code).emit("room:update", roomPayload(session, db));
  }

  async function submitAnswer({ code, user, optionIds }) {
    const db = await store.read();
    const session = db.sessions.find((item) => item.code === code);
    if (!session || !user || user.role !== "participant") throw new Error("Сначала подключитесь к комнате");
    if (session.status !== "active" || Date.now() > session.questionEndsAt) throw new Error("Время ответа истекло");

    const quiz = db.quizzes.find((item) => item.id === session.quizId);
    const question = quiz.questions[session.currentQuestionIndex];
    const safeOptionIds = [...new Set(optionIds || [])].filter((optionId) =>
      question.options.some((option) => option.id === optionId)
    );

    if (question.choiceMode === "single" && safeOptionIds.length !== 1) throw new Error("Выберите один вариант");
    if (question.choiceMode === "multiple" && safeOptionIds.length === 0) throw new Error("Выберите вариант ответа");

    session.answers[question.id][user.id] = {
      optionIds: safeOptionIds,
      submittedAt: Date.now(),
      scored: false
    };

    await store.write(db);
    io.to(session.code).emit("room:update", roomPayload(session, db));
  }

  return {
    closeQuestion,
    finishSession,
    startQuestion,
    submitAnswer
  };
}
