import { createEmptyQuestion, createOption } from "../utils/quizFactory";

export const starterQuiz = {
  title: "Лёгкий квиз: разминка",
  description: "Готовый шаблон на 5 вопросов для быстрого запуска первой комнаты.",
  categories: "Общий кругозор, Лёгкий",
  defaultTime: 25,
  rules: {
    shuffleQuestions: false,
    showCorrectAfterQuestion: true,
    speedBonus: true
  },
  questions: [
    {
      ...createEmptyQuestion(),
      title: "Эта планета известна как Красная планета.",
      points: 500,
      timeLimit: 25,
      options: [createOption("Марс", true), createOption("Венера"), createOption("Юпитер"), createOption("Меркурий")]
    },
    {
      ...createEmptyQuestion(),
      title: "Именно столько цветов обычно выделяют в радуге.",
      points: 500,
      timeLimit: 25,
      options: [createOption("Семь", true), createOption("Пять"), createOption("Девять"), createOption("Двенадцать")]
    },
    {
      ...createEmptyQuestion(),
      title: "Столица Франции.",
      points: 500,
      timeLimit: 25,
      options: [createOption("Париж", true), createOption("Лион"), createOption("Марсель"), createOption("Ницца")]
    },
    {
      ...createEmptyQuestion(),
      title: "Самый большой океан Земли.",
      points: 600,
      timeLimit: 25,
      options: [
        createOption("Тихий", true),
        createOption("Атлантический"),
        createOption("Индийский"),
        createOption("Северный Ледовитый")
      ]
    },
    {
      ...createEmptyQuestion(),
      title: "Автор сказки о Золотой рыбке.",
      points: 600,
      timeLimit: 25,
      options: [createOption("Александр Пушкин", true), createOption("Лев Толстой"), createOption("Николай Гоголь"), createOption("Иван Крылов")]
    }
  ]
};
