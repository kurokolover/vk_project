import express from "express";
import { createDefaultQuizzes } from "../data/defaultQuizzes.js";
import { createId } from "../quizzes/quizService.js";

export function createAuthRouter({ store, authService }) {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Заполните имя, email и пароль" });
    if (String(password).length < 6) return res.status(400).json({ message: "Пароль должен быть минимум 6 символов" });
    if (!["participant", "organizer"].includes(role)) return res.status(400).json({ message: "Выберите роль" });

    const db = await store.read();
    if (db.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ message: "Пользователь с таким email уже есть" });
    }

    const user = {
      id: createId("user"),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      passwordHash: authService.hashPassword(password),
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    if (role === "organizer") {
      db.quizzes.push(...createDefaultQuizzes(user.id));
    }
    await store.write(db);
    res.json({ token: authService.signToken(user), user: authService.publicUser(user) });
  });

  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const db = await store.read();
    const user = db.users.find((item) => item.email === String(email || "").trim().toLowerCase());
    if (!user || !authService.verifyPassword(password || "", user.passwordHash)) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    res.json({ token: authService.signToken(user), user: authService.publicUser(user) });
  });

  return router;
}
