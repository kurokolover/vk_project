// @ts-check
import {
  Clock3,
  Crown,
  Image,
  KeyRound,
  ListChecks,
  Radio,
  Settings2,
  Trophy,
  UsersRound
} from "lucide-react";

/**
 * @typedef {"participant" | "organizer"} UserRole
 * @typedef {"dashboard" | "builder" | "room" | "history"} AppView
 * @typedef {{ quizzes: number, sessions: number, wins: number }} DashboardStats
 * @typedef {{ label: string, value: number, icon: import("lucide-react").LucideIcon }} DashboardMetric
 * @typedef {{ title: string, text: string, icon: import("lucide-react").LucideIcon }} FlowStep
 * @typedef {{ id: string, title: string, text: string, icon: import("lucide-react").LucideIcon }} MvpItem
 */

/** @type {Record<UserRole, FlowStep[]>} */
export const roleFlows = {
  participant: [
    { title: "Введите код", text: "Код комнаты выдаёт организатор перед стартом.", icon: KeyRound },
    { title: "Отвечайте вовремя", text: "Вопрос доступен только во время демонстрации.", icon: Clock3 },
    { title: "Смотрите итог", text: "Финальный лидерборд сохраняется в истории.", icon: Trophy }
  ],
  organizer: [
    { title: "Настройте квиз", text: "Категории, таймер, правила и баллы задаются в конструкторе.", icon: Settings2 },
    { title: "Запустите комнату", text: "Код комнаты создаётся автоматически для участников.", icon: Radio },
    { title: "Проведите финал", text: "Система считает баллы и показывает победителей.", icon: Crown }
  ]
};

/** @type {MvpItem[]} */
export const mvpItems = [
  {
    id: "auth",
    title: "Роли и вход",
    text: "Регистрация, авторизация и разделение кабинетов участника и организатора.",
    icon: UsersRound
  },
  {
    id: "builder",
    title: "Конструктор",
    text: "Создание квиза, категории, время, правила, баллы и варианты ответов.",
    icon: ListChecks
  },
  {
    id: "question-types",
    title: "Типы вопросов",
    text: "Текстовые и image-вопросы, одиночный и множественный выбор.",
    icon: Image
  },
  {
    id: "live",
    title: "Live-комната",
    text: "Подключение по коду и синхронный показ текущего вопроса.",
    icon: Radio
  },
  {
    id: "score",
    title: "Баллы и финал",
    text: "Подсчёт очков, бонус скорости, победитель и лидерборд.",
    icon: Trophy
  }
];

/**
 * @param {UserRole} role
 * @param {DashboardStats} stats
 * @returns {DashboardMetric[]}
 */
export function createDashboardMetrics(role, stats) {
  return [
    {
      label: role === "organizer" ? "Квизов готово" : "Участий",
      value: role === "organizer" ? stats.quizzes : stats.sessions,
      icon: ListChecks
    },
    {
      label: role === "organizer" ? "Проведено комнат" : "Комнат в истории",
      value: stats.sessions,
      icon: Radio
    },
    { label: "Побед", value: stats.wins, icon: Crown }
  ];
}

/**
 * @param {UserRole} role
 * @param {string} mvpItemId
 * @returns {AppView}
 */
export function getMvpTargetView(role, mvpItemId) {
  const builderTargets = new Set(["builder", "question-types"]);
  return role === "organizer" && builderTargets.has(mvpItemId) ? "builder" : "room";
}
