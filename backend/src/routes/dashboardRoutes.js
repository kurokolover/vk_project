import express from "express";
import { buildLeaderboard } from "../quizzes/quizService.js";

export function createDashboardRouter({ store, authService }) {
  const router = express.Router();
  router.use(authService.authMiddleware);

  router.get("/me", async (req, res) => {
    res.json({ user: authService.publicUser(req.user) });
  });

  router.get("/dashboard", async (req, res) => {
    const db = await store.read();
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

  return router;
}
