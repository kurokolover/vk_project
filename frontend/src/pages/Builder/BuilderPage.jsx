import { useEffect, useState } from "react";
import { Check, ListChecks, Play, Plus, Save, X } from "lucide-react";
import { starterQuiz } from "../../data/starterQuiz";
import { apiRequest } from "../../services/api";
import { createEmptyQuestion, createOption } from "../../utils/quizFactory";
import "./BuilderPage.css";

const categoryPresets = ["Общий кругозор", "Лёгкий", "Средний", "Сложный", "История", "Наука", "Культура", "География"];

export function BuilderPage({ token, quizzes, setQuizzes, setRoomCode, setView, notify, refresh }) {
  const [selectedId, setSelectedId] = useState(quizzes[0]?.id || "new");
  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedId);
  const [draft, setDraft] = useState(selectedQuiz || starterQuiz);

  useEffect(() => {
    const quiz = quizzes.find((item) => item.id === selectedId);
    setDraft(quiz || starterQuiz);
  }, [selectedId, quizzes]);

  function updateQuestion(questionId, patch) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId ? { ...question, ...patch } : question
      )
    }));
  }

  function updateOption(questionId, optionId, patch) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.id !== questionId) return question;
        return {
          ...question,
          options: question.options.map((option) => (option.id === optionId ? { ...option, ...patch } : option))
        };
      })
    }));
  }

  function markCorrect(question, optionId) {
    const options = question.options.map((option) => {
      if (question.choiceMode === "single") return { ...option, correct: option.id === optionId };
      return option.id === optionId ? { ...option, correct: !option.correct } : option;
    });
    updateQuestion(question.id, { options });
  }

  function getDraftCategories() {
    const raw = Array.isArray(draft.categories) ? draft.categories.join(", ") : draft.categories || "";
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function toggleCategory(category) {
    const categories = getDraftCategories();
    const next = categories.includes(category)
      ? categories.filter((item) => item !== category)
      : [...categories, category];
    setDraft({ ...draft, categories: next.join(", ") });
  }

  const summary = draft.questions.reduce(
    (acc, question) => ({
      totalTime: acc.totalTime + Number(question.timeLimit || 0),
      totalPoints: acc.totalPoints + Number(question.points || 0),
      imageQuestions: acc.imageQuestions + (question.type === "image" ? 1 : 0),
      multiQuestions: acc.multiQuestions + (question.choiceMode === "multiple" ? 1 : 0)
    }),
    { totalTime: 0, totalPoints: 0, imageQuestions: 0, multiQuestions: 0 }
  );

  async function save() {
    try {
      const data = await apiRequest(selectedQuiz ? `/api/quizzes/${selectedQuiz.id}` : "/api/quizzes", {
        token,
        method: selectedQuiz ? "PUT" : "POST",
        body: draft
      });
      const next = selectedQuiz
        ? quizzes.map((quiz) => (quiz.id === data.quiz.id ? data.quiz : quiz))
        : [data.quiz, ...quizzes];
      setQuizzes(next);
      setSelectedId(data.quiz.id);
      notify("Квиз сохранён");
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function launch() {
    try {
      if (!selectedQuiz) {
        notify("Сначала сохраните квиз");
        return;
      }
      const data = await apiRequest(`/api/quizzes/${selectedQuiz.id}/launch`, { token, method: "POST" });
      setRoomCode(data.session.code);
      setView("room");
      notify(`Комната ${data.session.code} создана`);
    } catch (error) {
      notify(error.message);
    }
  }

  return (
    <section className="builder-layout">
      <aside className="quiz-list">
        <button className={selectedId === "new" ? "quiz-row active" : "quiz-row"} onClick={() => setSelectedId("new")}>
          <Plus size={18} />
          Новый квиз
        </button>
        {quizzes.map((quiz) => (
          <button
            className={selectedId === quiz.id ? "quiz-row active" : "quiz-row"}
            key={quiz.id}
            onClick={() => setSelectedId(quiz.id)}
          >
            <ListChecks size={18} />
            <span>{quiz.title}</span>
          </button>
        ))}

        <div className="builder-inspector">
          <p className="eyebrow">Сводка</p>
          <strong>{draft.questions.length} вопросов</strong>
          <span>{summary.totalTime} сек · {summary.totalPoints} баллов</span>
          <span>{summary.imageQuestions} image · {summary.multiQuestions} multi</span>
        </div>
      </aside>

      <div className="builder-main">
        <section className="surface">
          <div className="section-head">
            <div>
              <p className="eyebrow">Настройки</p>
              <h2>{selectedQuiz ? "Редактирование квиза" : "Новый квиз"}</h2>
            </div>
            <div className="row-actions">
              <button className="secondary" onClick={save}>
                <Save size={18} />
                Сохранить
              </button>
              <button className="primary" onClick={launch}>
                <Play size={18} />
                Запустить
              </button>
            </div>
          </div>

          <div className="settings-grid">
            <label>
              Название
              <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </label>
            <label>
              Категории
              <input
                value={Array.isArray(draft.categories) ? draft.categories.join(", ") : draft.categories}
                onChange={(event) => setDraft({ ...draft, categories: event.target.value })}
              />
            </label>
            <label className="span-2">
              Описание
              <textarea
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                rows={2}
              />
            </label>
          </div>

          <div className="category-picker">
            {categoryPresets.map((category) => (
              <button
                className={getDraftCategories().includes(category) ? "category-chip active" : "category-chip"}
                key={category}
                onClick={() => toggleCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="rule-line">
            <label className="checkline">
              <input
                type="checkbox"
                checked={draft.rules?.showCorrectAfterQuestion !== false}
                onChange={(event) =>
                  setDraft({ ...draft, rules: { ...draft.rules, showCorrectAfterQuestion: event.target.checked } })
                }
              />
              Показывать правильный ответ после вопроса
            </label>
            <label className="checkline">
              <input
                type="checkbox"
                checked={draft.rules?.speedBonus !== false}
                onChange={(event) => setDraft({ ...draft, rules: { ...draft.rules, speedBonus: event.target.checked } })}
              />
              Бонус за скорость
            </label>
          </div>
        </section>

        <div className="question-stack">
          {draft.questions.map((question, index) => (
            <article className="question-card" key={question.id}>
              <div className="question-top">
                <strong>Вопрос {index + 1}</strong>
                <button
                  className="icon-btn danger"
                  title="Удалить вопрос"
                  onClick={() =>
                    setDraft({ ...draft, questions: draft.questions.filter((item) => item.id !== question.id) })
                  }
                >
                  <X size={16} />
                </button>
              </div>

              <label>
                Формулировка
                <input value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} />
              </label>

              <div className="settings-grid tight">
                <label>
                  Тип
                  <select value={question.type} onChange={(event) => updateQuestion(question.id, { type: event.target.value })}>
                    <option value="text">Текст</option>
                    <option value="image">Изображение</option>
                  </select>
                </label>
                <label>
                  Ответ
                  <select
                    value={question.choiceMode}
                    onChange={(event) => updateQuestion(question.id, { choiceMode: event.target.value })}
                  >
                    <option value="single">Один вариант</option>
                    <option value="multiple">Несколько вариантов</option>
                  </select>
                </label>
                <label>
                  Секунды
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={question.timeLimit}
                    onChange={(event) => updateQuestion(question.id, { timeLimit: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Баллы
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    step="100"
                    value={question.points}
                    onChange={(event) => updateQuestion(question.id, { points: Number(event.target.value) })}
                  />
                </label>
              </div>

              {question.type === "image" && (
                <label>
                  URL изображения
                  <input
                    value={question.imageUrl}
                    onChange={(event) => updateQuestion(question.id, { imageUrl: event.target.value })}
                    placeholder="https://..."
                  />
                </label>
              )}

              <div className="option-list">
                {question.options.map((option) => (
                  <div className="option-edit" key={option.id}>
                    <button
                      className={option.correct ? "correct-toggle on" : "correct-toggle"}
                      title="Правильный ответ"
                      onClick={() => markCorrect(question, option.id)}
                    >
                      <Check size={16} />
                    </button>
                    <input
                      value={option.text}
                      onChange={(event) => updateOption(question.id, option.id, { text: event.target.value })}
                      placeholder="Вариант ответа"
                    />
                    <button
                      className="icon-btn"
                      title="Удалить вариант"
                      onClick={() =>
                        updateQuestion(question.id, {
                          options: question.options.filter((item) => item.id !== option.id)
                        })
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  className="secondary compact"
                  onClick={() => updateQuestion(question.id, { options: [...question.options, createOption()] })}
                >
                  <Plus size={16} />
                  Вариант
                </button>
              </div>
            </article>
          ))}

          <button className="add-question" onClick={() => setDraft({ ...draft, questions: [...draft.questions, createEmptyQuestion()] })}>
            <Plus size={18} />
            Добавить вопрос
          </button>
        </div>
      </div>
    </section>
  );
}
