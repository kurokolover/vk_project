import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell/AppShell";
import { apiRequest } from "../services/api";
import { AuthPage } from "../pages/Auth/AuthPage";
import { BuilderPage } from "../pages/Builder/BuilderPage";
import { DashboardPage } from "../pages/Dashboard/DashboardPage";
import { HistoryPage } from "../pages/History/HistoryPage";
import { LiveRoomPage } from "../pages/LiveRoom/LiveRoomPage";

export function App() {
  const [token, setToken] = useState(localStorage.getItem("quizhub_token") || "");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [toast, setToast] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [roomCode, setRoomCode] = useState("");

  useEffect(() => {
    if (!token) return;
    apiRequest("/api/me", { token })
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
      apiRequest("/api/dashboard", { token }),
      user?.role === "organizer" ? apiRequest("/api/quizzes", { token }) : Promise.resolve({ quizzes: [] })
    ]);
    setDashboard(dash);
    setQuizzes(list.quizzes || []);
  }

  if (!user) {
    return <AuthPage onAuth={persistSession} notify={notify} toast={toast} />;
  }

  return (
    <AppShell user={user} view={view} onViewChange={setView} onLogout={logout}>
      {view === "dashboard" && (
        <DashboardPage
          user={user}
          dashboard={dashboard}
          quizzes={quizzes}
          token={token}
          setRoomCode={setRoomCode}
          setView={setView}
          notify={notify}
          refresh={refresh}
        />
      )}
      {view === "builder" && user.role === "organizer" && (
        <BuilderPage
          token={token}
          quizzes={quizzes}
          setQuizzes={setQuizzes}
          setRoomCode={setRoomCode}
          setView={setView}
          notify={notify}
          refresh={refresh}
        />
      )}
      {view === "room" && <LiveRoomPage token={token} user={user} initialCode={roomCode} notify={notify} refresh={refresh} />}
      {view === "history" && <HistoryPage dashboard={dashboard} />}
      {toast && <div className="toast">{toast}</div>}
    </AppShell>
  );
}
