import crypto from "crypto";

export function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

export function createRoomCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export function sanitizeQuiz(quiz, includeAnswers = false) {
  return {
    ...quiz,
    questions: quiz.questions.map((question) => ({
      ...question,
      options: question.options.map((option) => ({
        ...option,
        correct: includeAnswers ? option.correct : undefined
      }))
    }))
  };
}

export function activeQuestion(quiz, session, reveal = false) {
  const question = quiz.questions[session.currentQuestionIndex];
  if (!question) return null;

  return {
    id: question.id,
    title: question.title,
    type: question.type,
    imageUrl: question.imageUrl,
    choiceMode: question.choiceMode,
    timeLimit: question.timeLimit,
    points: question.points,
    options: question.options.map((option) => ({
      id: option.id,
      text: option.text,
      correct: reveal ? option.correct : undefined
    }))
  };
}

export function buildLeaderboard(session) {
  return Object.values(session.participants || {})
    .map((participant) => ({
      id: participant.userId,
      name: participant.name,
      score: participant.score || 0,
      correctAnswers: participant.correctAnswers || 0,
      answered: participant.answered || 0
    }))
    .sort((a, b) => b.score - a.score || b.correctAnswers - a.correctAnswers || a.name.localeCompare(b.name));
}

export function roomPayload(session, db, viewerRole = "participant") {
  const quiz = db.quizzes.find((item) => item.id === session.quizId);
  const reveal = session.status === "review" || session.status === "finished" || viewerRole === "organizer";
  const question = quiz ? activeQuestion(quiz, session, reveal) : null;
  const currentAnswers = question ? session.answers?.[question.id] || {} : {};

  return {
    session: {
      id: session.id,
      code: session.code,
      status: session.status,
      currentQuestionIndex: session.currentQuestionIndex,
      questionStartedAt: session.questionStartedAt,
      questionEndsAt: session.questionEndsAt,
      participants: Object.values(session.participants || {}),
      answeredCurrentQuestion: Object.keys(currentAnswers).length,
      leaderboard: buildLeaderboard(session),
      totalQuestions: quiz?.questions.length || 0
    },
    quiz: quiz
      ? {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          categories: quiz.categories,
          rules: quiz.rules
        }
      : null,
    question
  };
}

export function normalizeQuiz(input, organizerId, previous = {}) {
  const now = new Date().toISOString();
  const questions = (input.questions || []).map((question, index) => ({
    id: question.id || createId("q"),
    title: String(question.title || `Вопрос ${index + 1}`).trim(),
    type: question.type === "image" ? "image" : "text",
    imageUrl: String(question.imageUrl || "").trim(),
    choiceMode: question.choiceMode === "multiple" ? "multiple" : "single",
    timeLimit: Math.max(10, Math.min(Number(question.timeLimit) || Number(input.defaultTime) || 30, 180)),
    points: Math.max(100, Math.min(Number(question.points) || 1000, 5000)),
    options: (question.options || []).slice(0, 8).map((option, optionIndex) => ({
      id: option.id || createId("o"),
      text: String(option.text || `Вариант ${optionIndex + 1}`).trim(),
      correct: Boolean(option.correct)
    }))
  }));

  return {
    id: previous.id || createId("quiz"),
    organizerId,
    title: String(input.title || "Новый квиз").trim(),
    description: String(input.description || "").trim(),
    categories: String(input.categories || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    defaultTime: Math.max(10, Math.min(Number(input.defaultTime) || 30, 180)),
    rules: {
      shuffleQuestions: Boolean(input.rules?.shuffleQuestions),
      showCorrectAfterQuestion: input.rules?.showCorrectAfterQuestion !== false,
      speedBonus: input.rules?.speedBonus !== false
    },
    questions,
    createdAt: previous.createdAt || now,
    updatedAt: now
  };
}

export function validateQuiz(quiz) {
  if (!quiz.title) return "Укажите название квиза";
  if (quiz.questions.length === 0) return "Добавьте хотя бы один вопрос";

  for (const [index, question] of quiz.questions.entries()) {
    if (!question.title) return `Заполните текст вопроса ${index + 1}`;
    if (question.type === "image" && !question.imageUrl) return `Добавьте ссылку на изображение в вопросе ${index + 1}`;
    if (question.options.length < 2) return `Добавьте минимум два варианта ответа в вопросе ${index + 1}`;
    if (!question.options.some((option) => option.correct)) return `Отметьте правильный ответ в вопросе ${index + 1}`;
    if (question.choiceMode === "single" && question.options.filter((option) => option.correct).length > 1) {
      return `В одиночном вопросе ${index + 1} должен быть один правильный ответ`;
    }
  }

  return null;
}
