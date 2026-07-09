import { createEmptyQuestion, createOption } from "../utils/quizFactory";

export const starterQuiz = {
  title: "VK Quiz Night",
  description: "Быстрый командный квиз для проверки MVP в реальном времени.",
  categories: "Frontend, WebSocket, Продукт",
  defaultTime: 30,
  rules: {
    shuffleQuestions: false,
    showCorrectAfterQuestion: true,
    speedBonus: true
  },
  questions: [
    {
      ...createEmptyQuestion(),
      title: "Какой протокол удобнее всего использовать для live-комнаты квиза?",
      options: [createOption("WebSocket", true), createOption("Только HTML"), createOption("CSV-файл")]
    },
    {
      ...createEmptyQuestion(),
      title: "Какие элементы входят в MVP этого проекта?",
      choiceMode: "multiple",
      options: [
        createOption("Создание квиза", true),
        createOption("Подключение по коду", true),
        createOption("Лидерборд", true),
        createOption("3D-редактор видео")
      ]
    }
  ]
};
