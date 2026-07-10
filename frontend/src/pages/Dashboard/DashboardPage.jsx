// @ts-check
import { useMemo, useState } from "react";
import { apiRequest } from "../../services/api";
import { ControlPanel } from "./components/ControlPanel";
import { DashboardHero } from "./components/DashboardHero";
import { FlowGuide } from "./components/FlowGuide";
import { MetricsGrid } from "./components/MetricsGrid";
import { MvpConsole } from "./components/MvpConsole";
import { createDashboardMetrics, getMvpTargetView, mvpItems, roleFlows } from "./dashboardContent";
import "./DashboardPage.css";

/**
 * @typedef {import("./dashboardContent").AppView} AppView
 * @typedef {import("./dashboardContent").DashboardStats} DashboardStats
 * @typedef {import("./dashboardContent").UserRole} UserRole
 * @typedef {{ id: string, title: string, categories: string[], questions: unknown[] }} QuizSummary
 * @typedef {{ id: string, name: string, role: UserRole }} CurrentUser
 * @typedef {{ stats?: DashboardStats }} DashboardData
 */

/**
 * @param {{
 *   user: CurrentUser,
 *   dashboard: DashboardData | null,
 *   quizzes?: QuizSummary[],
 *   token: string,
 *   setRoomCode: (code: string) => void,
 *   setView: (view: AppView) => void,
 *   notify: (message: string) => void,
 *   refresh: () => void
 * }} props
 */
export function DashboardPage({ user, dashboard, quizzes = [], token, setRoomCode, setView, notify, refresh }) {
  const [quickCode, setQuickCode] = useState("");
  const [activeMvpId, setActiveMvpId] = useState("live");
  const [launchingId, setLaunchingId] = useState("");
  const stats = dashboard?.stats || { quizzes: 0, sessions: 0, wins: 0 };
  const flow = roleFlows[user.role];
  const quickQuizzes = useMemo(() => quizzes.slice(0, 3), [quizzes]);
  const metrics = useMemo(() => createDashboardMetrics(user.role, stats), [stats, user.role]);

  function openBuilder() {
    setView("builder");
  }

  function openRoom() {
    setView("room");
  }

  function joinFromDashboard() {
    const cleanCode = quickCode.trim().toUpperCase();
    if (!cleanCode) {
      notify("Введите код комнаты");
      return;
    }

    setRoomCode(cleanCode);
    openRoom();
    notify(`Код ${cleanCode} перенесён в live-комнату`);
  }

  /**
   * @param {string} quizId
   */
  async function launchQuiz(quizId) {
    try {
      setLaunchingId(quizId);
      const data = await apiRequest(`/api/quizzes/${quizId}/launch`, { token, method: "POST" });
      setRoomCode(data.session.code);
      openRoom();
      notify(`Комната ${data.session.code} создана`);
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Не удалось запустить квиз");
    } finally {
      setLaunchingId("");
    }
  }

  /**
   * @param {number} stepIndex
   */
  function openFlowStep(stepIndex) {
    setView(user.role === "organizer" && stepIndex === 0 ? "builder" : "room");
  }

  /**
   * @param {string} itemId
   */
  function openMvpItem(itemId) {
    setView(getMvpTargetView(user.role, itemId));
  }

  return (
    <section className="stack dashboard-stack">
      <MetricsGrid metrics={metrics} />

      <section className="dashboard-grid">
        <DashboardHero
          role={user.role}
          quickCode={quickCode}
          onCreateQuiz={openBuilder}
          onJoinByCode={joinFromDashboard}
          onQuickCodeChange={setQuickCode}
        />

        <ControlPanel
          role={user.role}
          flow={flow}
          quizzes={quickQuizzes}
          launchingId={launchingId}
          onCreateQuiz={openBuilder}
          onLaunchQuiz={launchQuiz}
        />
      </section>

      <MvpConsole
        items={mvpItems}
        activeId={activeMvpId}
        onActiveChange={setActiveMvpId}
        onOpenActive={openMvpItem}
      />

      <FlowGuide flow={flow} onOpenStep={openFlowStep} />
    </section>
  );
}
