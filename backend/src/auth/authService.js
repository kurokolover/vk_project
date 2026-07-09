import crypto from "crypto";

export function createAuthService({ store, secret }) {
  function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
    return `${salt}:${hash}`;
  }

  function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(":");
    const calculatedHash = hashPassword(password, salt).split(":")[1];
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(calculatedHash));
  }

  function signToken(user) {
    const payload = Buffer.from(
      JSON.stringify({ id: user.id, email: user.email, role: user.role, name: user.name })
    ).toString("base64url");
    const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    return `${payload}.${sig}`;
  }

  async function userFromToken(token) {
    if (!token || !token.includes(".")) return null;
    const [payload, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    if (sig !== expected) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const db = await store.read();
    return db.users.find((user) => user.id === data.id) || null;
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

  async function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const user = await userFromToken(token);
    if (!user) return res.status(401).json({ message: "Нужно войти в аккаунт" });

    req.user = user;
    next();
  }

  return {
    authMiddleware,
    hashPassword,
    publicUser,
    signToken,
    userFromToken,
    verifyPassword
  };
}
