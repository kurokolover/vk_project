import express from "express";
import { ensureDefaultQuizzes } from "../data/defaultQuizzes.js";
import { createId, createRoomCode, normalizeQuiz, roomPayload, sanitizeQuiz, validateQuiz } from "../quizzes/quizService.js";

export function createQuizRouter({ store, authService }) {
  const router = express.Router();
  router.use(authService.authMiddleware);

  router.get("/quizzes", async (req, res) => {
    const db = await store.read();
    if (req.user.role === "organizer" && ensureDefaultQuizzes(db, req.user.id)) {
      await store.write(db);
    }
    res.json({
      quizzes: db.quizzes
        .filter((quiz) => quiz.organizerId === req.user.id)
        .map((quiz) => sanitizeQuiz(quiz, true))
    });
  });

  router.post("/quizzes", async (req, res) => {
    if (req.user.role !== "organizer") return res.status(403).json({ message: "Создавать квизы могут организаторы" });

    const db = await store.read();
    const quiz = normalizeQuiz(req.body, req.user.id);
    const error = validateQuiz(quiz);
    if (error) return res.status(400).json({ message: error });

    db.quizzes.push(quiz);
    await store.write(db);
    res.json({ quiz: sanitizeQuiz(quiz, true) });
  });

  router.put("/quizzes/:id", async (req, res) => {
    const db = await store.read();
    const index = db.quizzes.findIndex((quiz) => quiz.id === req.params.id && quiz.organizerId === req.user.id);
    if (index === -1) return res.status(404).json({ message: "Квиз не найден" });

    const quiz = normalizeQuiz(req.body, req.user.id, db.quizzes[index]);
    const error = validateQuiz(quiz);
    if (error) return res.status(400).json({ message: error });

    db.quizzes[index] = quiz;
    await store.write(db);
    res.json({ quiz: sanitizeQuiz(quiz, true) });
  });

  router.post("/quizzes/:id/launch", async (req, res) => {
    const db = await store.read();
    const quiz = db.quizzes.find((item) => item.id === req.params.id && item.organizerId === req.user.id);
    if (!quiz) return res.status(404).json({ message: "Квиз не найден" });

    const session = {
      id: createId("session"),
      quizId: quiz.id,
      organizerId: req.user.id,
      code: createRoomCode(),
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
    await store.write(db);
    res.json({ session: roomPayload(session, db).session });
  });

  router.get("/sessions/:code", async (req, res) => {
    const db = await store.read();
    const session = db.sessions.find((item) => item.code === req.params.code.toUpperCase());
    if (!session) return res.status(404).json({ message: "Комната не найдена" });

    res.json(roomPayload(session, db, req.user.role));
  });

  return router;
}
