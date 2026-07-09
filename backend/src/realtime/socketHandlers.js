import { roomPayload } from "../quizzes/quizService.js";

export function registerSocketHandlers({ io, store, authService, sessionService }) {
  io.on("connection", (socket) => {
    socket.on("room:join", async ({ code, token }, ack) => {
      try {
        const user = await authService.userFromToken(token);
        if (!user) throw new Error("Нужно войти в аккаунт");

        const db = await store.read();
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
          await store.write(db);
        }

        socket.join(session.code);
        socket.data.user = authService.publicUser(user);
        socket.data.code = session.code;

        ack?.({ ok: true, payload: roomPayload(session, db, user.role) });
        io.to(session.code).emit("room:update", roomPayload(session, db, user.role));
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("host:start", async (_payload, ack) => {
      try {
        await sessionService.startQuestion(socket.data.code, socket.data.user?.id);
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("host:close", async (_payload, ack) => {
      try {
        await sessionService.closeQuestion(socket.data.code);
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("host:finish", async (_payload, ack) => {
      try {
        await sessionService.finishSession(socket.data.code, socket.data.user?.id);
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("participant:answer", async ({ optionIds }, ack) => {
      try {
        await sessionService.submitAnswer({
          code: socket.data.code,
          user: socket.data.user,
          optionIds
        });
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });
  });
}
