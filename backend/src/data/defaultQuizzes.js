import { createId } from "../quizzes/quizService.js";

function option(text, correct = false) {
  return {
    id: createId("o"),
    text,
    correct
  };
}

function question({ title, options, points, timeLimit = 30 }) {
  return {
    id: createId("q"),
    title,
    type: "text",
    imageUrl: "",
    choiceMode: "single",
    timeLimit,
    points,
    options
  };
}

function quiz({ organizerId, templateKey, title, description, categories, defaultTime, questions }) {
  const now = new Date().toISOString();
  return {
    id: createId("quiz"),
    organizerId,
    templateKey,
    title,
    description,
    categories,
    defaultTime,
    rules: {
      shuffleQuestions: false,
      showCorrectAfterQuestion: true,
      speedBonus: true
    },
    questions,
    createdAt: now,
    updatedAt: now
  };
}

export function createDefaultQuizzes(organizerId) {
  return [
    quiz({
      organizerId,
      templateKey: "general-easy",
      title: "Лёгкий квиз: разминка",
      description: "Пять простых вопросов на общий кругозор для быстрого старта комнаты.",
      categories: ["Общий кругозор", "Лёгкий"],
      defaultTime: 25,
      questions: [
        question({
          title: "Эта планета известна как Красная планета.",
          points: 500,
          options: [option("Марс", true), option("Венера"), option("Юпитер"), option("Меркурий")]
        }),
        question({
          title: "Именно столько цветов обычно выделяют в радуге.",
          points: 500,
          options: [option("Семь", true), option("Пять"), option("Девять"), option("Двенадцать")]
        }),
        question({
          title: "Столица Франции.",
          points: 500,
          options: [option("Париж", true), option("Лион"), option("Марсель"), option("Ницца")]
        }),
        question({
          title: "Самый большой океан Земли.",
          points: 600,
          options: [option("Тихий", true), option("Атлантический"), option("Индийский"), option("Северный Ледовитый")]
        }),
        question({
          title: "Автор сказки о Золотой рыбке.",
          points: 600,
          options: [option("Александр Пушкин", true), option("Лев Толстой"), option("Николай Гоголь"), option("Иван Крылов")]
        })
      ]
    }),
    quiz({
      organizerId,
      templateKey: "general-medium",
      title: "Средний квиз: кругозор",
      description: "Вопросы средней сложности в формате коротких игровых формулировок.",
      categories: ["Общий кругозор", "Средний"],
      defaultTime: 35,
      questions: [
        question({
          title: "Этот химический элемент обозначается символом Fe.",
          points: 900,
          timeLimit: 35,
          options: [option("Железо", true), option("Фтор"), option("Франций"), option("Фермий")]
        }),
        question({
          title: "В этом городе находится Колизей.",
          points: 900,
          timeLimit: 35,
          options: [option("Рим", true), option("Афины"), option("Мадрид"), option("Стамбул")]
        }),
        question({
          title: "Эта единица измеряет силу электрического тока.",
          points: 1000,
          timeLimit: 35,
          options: [option("Ампер", true), option("Вольт"), option("Ом"), option("Ватт")]
        }),
        question({
          title: "Роман «Преступление и наказание» написал этот автор.",
          points: 1000,
          timeLimit: 35,
          options: [option("Фёдор Достоевский", true), option("Антон Чехов"), option("Иван Тургенев"), option("Максим Горький")]
        }),
        question({
          title: "Это государство занимает целый материк.",
          points: 1100,
          timeLimit: 35,
          options: [option("Австралия", true), option("Канада"), option("Индия"), option("Бразилия")]
        })
      ]
    }),
    quiz({
      organizerId,
      templateKey: "general-hard",
      title: "Сложный квиз: финальный раунд",
      description: "Пять вопросов посложнее для финала или опытной аудитории.",
      categories: ["Общий кругозор", "Сложный"],
      defaultTime: 45,
      questions: [
        question({
          title: "Эта наука изучает происхождение, строение и развитие Вселенной.",
          points: 1500,
          timeLimit: 45,
          options: [option("Космология", true), option("Геодезия"), option("Сейсмология"), option("Картография")]
        }),
        question({
          title: "Этот композитор написал цикл «Времена года» из четырёх скрипичных концертов.",
          points: 1500,
          timeLimit: 45,
          options: [option("Антонио Вивальди", true), option("Иоганн Бах"), option("Вольфганг Моцарт"), option("Фредерик Шопен")]
        }),
        question({
          title: "Так называется процесс перехода вещества из твёрдого состояния сразу в газообразное.",
          points: 1600,
          timeLimit: 45,
          options: [option("Сублимация", true), option("Конденсация"), option("Диффузия"), option("Кристаллизация")]
        }),
        question({
          title: "Этот мореплаватель возглавил первую экспедицию, совершившую кругосветное плавание.",
          points: 1700,
          timeLimit: 45,
          options: [option("Фернан Магеллан", true), option("Джеймс Кук"), option("Христофор Колумб"), option("Васко да Гама")]
        }),
        question({
          title: "В математике это число равно отношению длины окружности к её диаметру.",
          points: 1500,
          timeLimit: 45,
          options: [option("Пи", true), option("Фи"), option("е"), option("Ноль")]
        })
      ]
    })
  ];
}

export function ensureDefaultQuizzes(db, organizerId) {
  const technicalCategories = new Set(["Frontend", "Backend", "WebSocket", "API", "Smoke"]);
  const beforeCleanup = db.quizzes.length;
  db.quizzes = db.quizzes.filter((quizItem) => {
    if (quizItem.organizerId !== organizerId) return true;
    if (["VK Quiz Night", "Smoke Quiz"].includes(quizItem.title)) return false;
    return !(quizItem.categories || []).some((category) => technicalCategories.has(category));
  });

  const templates = createDefaultQuizzes(organizerId);
  const existingKeys = new Set(
    db.quizzes.filter((quizItem) => quizItem.organizerId === organizerId).map((quizItem) => quizItem.templateKey)
  );
  const missing = templates.filter((template) => !existingKeys.has(template.templateKey));

  if (missing.length > 0) {
    db.quizzes.push(...missing);
  }

  return missing.length > 0 || db.quizzes.length !== beforeCleanup;
}
