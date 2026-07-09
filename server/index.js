import express from "express";
import http from "http";
import { Server } from "socket.io";
import crypto from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";
const PORT = process.env.PORT || 3001;
const CLIENT_DIST = path.join(__dirname, "..", "dist");

const defaultDb = {
  users: [],
  quizzes: [],
  sessions: []
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const roomTimers = new Map();

app.use(express.json({ limit: "2mb" }));

async function ensureDb() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DB_PATH, "utf8");
  } catch {
    await writeFile(DB_PATH, JSON.stringify(defaultDb, null, 2));
  }
}

async function readDb() {
  await ensureDb();
  const raw = await readFile(DB_PATH, "utf8");
  return JSON.parse(raw || JSON.stringify(defaultDb));
}

async function writeDb(db) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function roomCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashPassword(password, salt).split(":")[1]));
}

function signToken(user) {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, email: user.email, role: user.role, name: user.name })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

async function userFromToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (sig !== expected) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  const db = await readDb();
  return db.users.find((user) => user.id === data.id) || null;
}

async function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = await userFromToken(token);
  if (!user) return res.status(401).json({ message: "Нужно войти в аккаунт" });
  req.user = user;
  next();
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

function sanitizeQuiz(quiz, includeAnswers = false) {
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

function activeQuestion(quiz, session, reveal = false) {
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

function buildLeaderboard(session) {
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

function roomPayload(session, db, viewerRole = "participant") {
  const quiz = db.quizzes.find((item) => item.id === session.quizId);
  const reveal = session.status === "review" || session.status === "finished" || viewerRole === "organizer";
  return {
    session: {
      id: session.id,
      code: session.code,
      status: session.status,
      currentQuestionIndex: session.currentQuestionIndex,
      questionStartedAt: session.questionStartedAt,
      questionEndsAt: session.questionEndsAt,
      participants: Object.values(session.participants || {}),
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
    question: quiz ? activeQuestion(quiz, session, reveal) : null
  };
}

function normalizeQuiz(input, organizerId, previous = {}) {
  const now = new Date().toISOString();
  const questions = (input.questions || []).map((question, index) => ({
    id: question.id || id("q"),
    title: String(question.title || `Вопрос ${index + 1}`).trim(),
    type: question.type === "image" ? "image" : "text",
    imageUrl: String(question.imageUrl || "").trim(),
    choiceMode: question.choiceMode === "multiple" ? "multiple" : "single",
    timeLimit: Math.max(10, Math.min(Number(question.timeLimit) || Number(input.defaultTime) || 30, 180)),
    points: Math.max(100, Math.min(Number(question.points) || 1000, 5000)),
    options: (question.options || []).slice(0, 8).map((option, optionIndex) => ({
      id: option.id || id("o"),
      text: String(option.text || `Вариант ${optionIndex + 1}`).trim(),
      correct: Boolean(option.correct)
    }))
  }));

  return {
    id: previous.id || id("quiz"),
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

function validateQuiz(quiz) {
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

async function closeQuestion(code) {
  const db = await readDb();
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
  await writeDb(db);
  clearTimeout(roomTimers.get(code));
  roomTimers.delete(code);
  io.to(code).emit("room:update", roomPayload(session, db));
}

async function startQuestion(code, userId) {
  const db = await readDb();
  const session = db.sessions.find((item) => item.code === code);
  if (!session) throw new Error("Комната не найдена");
  if (session.organizerId !== userId) throw new Error("Только организатор может управлять комнатой");
  const quiz = db.quizzes.find((item) => item.id === session.quizId);
  const nextIndex = session.currentQuestionIndex + 1;
  if (!quiz || nextIndex >= quiz.questions.length) {
    session.status = "finished";
    session.finishedAt = new Date().toISOString();
    session.leaderboard = buildLeaderboard(session);
    await writeDb(db);
    io.to(code).emit("room:update", roomPayload(session, db));
    return;
  }

  session.status = "active";
  session.currentQuestionIndex = nextIndex;
  session.questionStartedAt = Date.now();
  session.questionEndsAt = session.questionStartedAt + quiz.questions[nextIndex].timeLimit * 1000;
  session.answers[quiz.questions[nextIndex].id] = {};
  await writeDb(db);
  clearTimeout(roomTimers.get(code));
  roomTimers.set(
    code,
    setTimeout(() => {
      closeQuestion(code);
    }, quiz.questions[nextIndex].timeLimit * 1000)
  );
  io.to(code).emit("room:update", roomPayload(session, db));
}

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Заполните имя, email и пароль" });
  if (!["participant", "organizer"].includes(role)) return res.status(400).json({ message: "Выберите роль" });
  const db = await readDb();
  if (db.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: "Пользователь с таким email уже есть" });
  }
  const user = {
    id: id("user"),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  await writeDb(db);
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const db = await readDb();
  const user = db.users.find((item) => item.email === String(email || "").trim().toLowerCase());
  if (!user || !verifyPassword(password || "", user.passwordHash)) {
    return res.status(401).json({ message: "Неверный email или пароль" });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get("/api/me", auth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.get("/api/dashboard", auth, async (req, res) => {
  const db = await readDb();
  const myQuizzes = db.quizzes.filter((quiz) => quiz.organizerId === req.user.id);
  const mySessions = db.sessions.filter((session) => {
    if (req.user.role === "organizer") return session.organizerId === req.user.id;
    return Boolean(session.participants?.[req.user.id]);
  });
  res.json({
    stats: {
      quizzes: myQuizzes.length,
      sessions: mySessions.length,
      wins: mySessions.filter((session) => buildLeaderboard(session)[0]?.id === req.user.id).length
    },
    history: mySessions
      .slice()
      .reverse()
      .map((session) => {
        const quiz = db.quizzes.find((item) => item.id === session.quizId);
        const leaderboard = buildLeaderboard(session);
        return {
          id: session.id,
          code: session.code,
          title: quiz?.title || "Квиз",
          status: session.status,
          createdAt: session.createdAt,
          finishedAt: session.finishedAt,
          score: session.participants?.[req.user.id]?.score || 0,
          place: leaderboard.findIndex((item) => item.id === req.user.id) + 1 || null,
          participants: leaderboard.length
        };
      })
  });
});

app.get("/api/quizzes", auth, async (req, res) => {
  const db = await readDb();
  res.json({
    quizzes: db.quizzes
      .filter((quiz) => quiz.organizerId === req.user.id)
      .map((quiz) => sanitizeQuiz(quiz, true))
  });
});

app.post("/api/quizzes", auth, async (req, res) => {
  if (req.user.role !== "organizer") return res.status(403).json({ message: "Создавать квизы могут организаторы" });
  const db = await readDb();
  const quiz = normalizeQuiz(req.body, req.user.id);
  const error = validateQuiz(quiz);
  if (error) return res.status(400).json({ message: error });
  db.quizzes.push(quiz);
  await writeDb(db);
  res.json({ quiz: sanitizeQuiz(quiz, true) });
});

app.put("/api/quizzes/:id", auth, async (req, res) => {
  const db = await readDb();
  const index = db.quizzes.findIndex((quiz) => quiz.id === req.params.id && quiz.organizerId === req.user.id);
  if (index === -1) return res.status(404).json({ message: "Квиз не найден" });
  const quiz = normalizeQuiz(req.body, req.user.id, db.quizzes[index]);
  const error = validateQuiz(quiz);
  if (error) return res.status(400).json({ message: error });
  db.quizzes[index] = quiz;
  await writeDb(db);
  res.json({ quiz: sanitizeQuiz(quiz, true) });
});

app.post("/api/quizzes/:id/launch", auth, async (req, res) => {
  const db = await readDb();
  const quiz = db.quizzes.find((item) => item.id === req.params.id && item.organizerId === req.user.id);
  if (!quiz) return res.status(404).json({ message: "Квиз не найден" });
  const session = {
    id: id("session"),
    quizId: quiz.id,
    organizerId: req.user.id,
    code: roomCode(),
    status: "waiting",
    currentQuestionIndex: -1,
    questionStartedAt: null,
    questionEndsAt: null,
    participants: {},
    answers: {},
    leaderboard: [],
    createdAt: new Date().toISOString(),
    finishedAt: null
  };
  db.sessions.push(session);
  await writeDb(db);
  res.json({ session: roomPayload(session, db).session });
});

app.get("/api/sessions/:code", auth, async (req, res) => {
  const db = await readDb();
  const session = db.sessions.find((item) => item.code === req.params.code.toUpperCase());
  if (!session) return res.status(404).json({ message: "Комната не найдена" });
  res.json(roomPayload(session, db, req.user.role));
});

io.on("connection", (socket) => {
  socket.on("room:join", async ({ code, token }, ack) => {
    try {
      const user = await userFromToken(token);
      if (!user) throw new Error("Нужно войти в аккаунт");
      const db = await readDb();
      const session = db.sessions.find((item) => item.code === String(code || "").toUpperCase());
      if (!session) throw new Error("Комната не найдена");
      if (user.role === "organizer" && session.organizerId !== user.id) throw new Error("Это комната другого организатора");
      if (user.role === "participant") {
        session.participants[user.id] ||= {
          userId: user.id,
          name: user.name,
          score: 0,
          correctAnswers: 0,
          answered: 0,
          joinedAt: new Date().toISOString()
        };
        await writeDb(db);
      }
      socket.join(session.code);
      socket.data.user = publicUser(user);
      socket.data.code = session.code;
      ack?.({ ok: true, payload: roomPayload(session, db, user.role) });
      io.to(session.code).emit("room:update", roomPayload(session, db, user.role));
    } catch (error) {
      ack?.({ ok: false, message: error.message });
    }
  });

  socket.on("host:start", async (_payload, ack) => {
    try {
      await startQuestion(socket.data.code, socket.data.user?.id);
      ack?.({ ok: true });
    } catch (error) {
      ack?.({ ok: false, message: error.message });
    }
  });

  socket.on("host:close", async (_payload, ack) => {
    try {
      await closeQuestion(socket.data.code);
      ack?.({ ok: true });
    } catch (error) {
      ack?.({ ok: false, message: error.message });
    }
  });

  socket.on("host:finish", async (_payload, ack) => {
    try {
      const db = await readDb();
      const session = db.sessions.find((item) => item.code === socket.data.code);
      if (!session || session.organizerId !== socket.data.user?.id) throw new Error("Нет доступа к комнате");
      session.status = "finished";
      session.finishedAt = new Date().toISOString();
      session.leaderboard = buildLeaderboard(session);
      await writeDb(db);
      clearTimeout(roomTimers.get(session.code));
      io.to(session.code).emit("room:update", roomPayload(session, db));
      ack?.({ ok: true });
    } catch (error) {
      ack?.({ ok: false, message: error.message });
    }
  });

  socket.on("participant:answer", async ({ optionIds }, ack) => {
    try {
      const db = await readDb();
      const session = db.sessions.find((item) => item.code === socket.data.code);
      const user = socket.data.user;
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
      await writeDb(db);
      ack?.({ ok: true });
      io.to(session.code).emit("room:update", roomPayload(session, db));
    } catch (error) {
      ack?.({ ok: false, message: error.message });
    }
  });
});

app.use(express.static(CLIENT_DIST));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(CLIENT_DIST, "index.html"));
});

server.listen(PORT, async () => {
  await ensureDb();
  console.log(`QuizHub API listening on http://localhost:${PORT}`);
});
