// @ts-check
import { Play, Plus, Sparkles } from "lucide-react";

/**
 * @typedef {import("../dashboardContent").FlowStep} FlowStep
 * @typedef {import("../dashboardContent").UserRole} UserRole
 * @typedef {{ id: string, title: string, categories: string[], questions: unknown[] }} QuizSummary
 */

/**
 * @param {{
 *   role: UserRole,
 *   flow: FlowStep[],
 *   quizzes: QuizSummary[],
 *   launchingId: string,
 *   onCreateQuiz: () => void,
 *   onLaunchQuiz: (quizId: string) => void
 * }} props
 */
export function ControlPanel({ role, flow, quizzes, launchingId, onCreateQuiz, onLaunchQuiz }) {
  const isOrganizer = role === "organizer";

  return (
    <article className="control-card">
      <div className="section-head compact-head">
        <div>
          <p className="eyebrow">{isOrganizer ? "Готовые квизы" : "Как это работает"}</p>
          <h2>{isOrganizer ? "Запуск без конструктора" : "Маршрут участника"}</h2>
        </div>
        <Sparkles size={22} />
      </div>

      {isOrganizer ? (
        <LaunchList quizzes={quizzes} launchingId={launchingId} onCreateQuiz={onCreateQuiz} onLaunchQuiz={onLaunchQuiz} />
      ) : (
        <FlowList flow={flow} />
      )}
    </article>
  );
}

/**
 * @param {{
 *   quizzes: QuizSummary[],
 *   launchingId: string,
 *   onCreateQuiz: () => void,
 *   onLaunchQuiz: (quizId: string) => void
 * }} props
 */
function LaunchList({ quizzes, launchingId, onCreateQuiz, onLaunchQuiz }) {
  return (
    <div className="launch-list">
      {quizzes.map((quiz) => (
        <div className="launch-row" key={quiz.id}>
          <div>
            <strong>{quiz.title}</strong>
            <span>
              {quiz.questions.length} вопросов · {quiz.categories.join(" / ")}
            </span>
          </div>
          <button className="secondary compact" disabled={launchingId === quiz.id} onClick={() => onLaunchQuiz(quiz.id)}>
            <Play size={16} />
            {launchingId === quiz.id ? "Запуск..." : "Запустить"}
          </button>
        </div>
      ))}

      {quizzes.length === 0 && (
        <button className="primary wide" onClick={onCreateQuiz}>
          <Plus size={18} />
          Создать первый квиз
        </button>
      )}
    </div>
  );
}

/**
 * @param {{ flow: FlowStep[] }} props
 */
function FlowList({ flow }) {
  return (
    <div className="flow-list">
      {flow.map((item, index) => {
        const Icon = item.icon;
        return (
          <div className="flow-row" key={item.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <Icon size={18} />
            <div>
              <strong>{item.title}</strong>
              <small>{item.text}</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
