// implements FR1-FR7 of add-project-locales
// Normative override inventories — mirror of the two tables in
// openspec/changes/add-project-locales/specs/project-locales/spec.md.
// Single source of truth for the project-dialect BDD steps.

// FR2: term regexes used to derive the override set from each base locale.
// The Russian regex uses Cyrillic-aware lookaround boundaries because
// JavaScript `\b` is ASCII-only and never matches around Cyrillic
// (same convention as LOWERCASE_ADDRESS_REGEX in locale_content.helpers.ts).
export const EN_TERM_REGEX = /\bgoals?\b/i;
export const RU_TERM_REGEX =
  /(?<![а-яёА-ЯЁ])цел(ь|ью|и|ей|ям|ями|ях)(?![а-яё])/iu;

export const EN_PROJECT_INVENTORY: Record<string, string> = {
  "commandBar.placeholder.goal": "New project...",
  "deleted.goals": "Projects",
  "deleted.purgeCountGoals_one": "{{count}} project",
  "deleted.purgeCountGoals_other": "{{count}} projects",
  "filter.focused_goals": "Focused Projects",
  "filter.goals": "Projects",
  "focusGoalReplacementDialog.message":
    "You already have 2 focused projects. Which one would you like to replace?",
  "focusGoalReplacementDialog.title": "Replace focused project",
  "goal.deleteConfirmName": "Delete project?",
  "goal.drag": "Drag project",
  "goal.editName": "Edit project",
  "goal.empty": "No projects yet",
  "goal.emptyActive": "No active projects",
  "goal.emptyFinished": "No finished projects",
  "goal.emptyPaused": "No paused projects",
  "goal.namePlaceholder": "Project name",
  "goal.notFound": "Project not found",
  "goal.pageName": "My Projects",
  "onboarding.dialogBody":
    "Would you like to start with an onboarding project? We'll create a project with tasks to help you learn the app's core features.",
  "onboarding.goalDescription":
    "Complete the tasks below to learn the core features of the app. After you're done, delete this project.",
  "search.goals": "Projects",
  "search.placeholder": "Tasks, projects and ideas...",
  "selector.goal": "Project",
  "selector.noGoal": "No project",
  "share.inviteMessage":
    "Try Clear Progress — an app for managing tasks, projects, and ideas!",
  "task.selectGoal": "Select project",
};

export const RU_PROJECT_INVENTORY: Record<string, string> = {
  "commandBar.placeholder.goal": "Новый проект...",
  "deleted.goals": "Проекты",
  "deleted.purgeCountGoals_one": "{{count}} проект",
  "deleted.purgeCountGoals_few": "{{count}} проекта",
  "deleted.purgeCountGoals_many": "{{count}} проектов",
  "filter.focused_goals": "Фокус на проектах",
  "filter.goals": "Проекты",
  "focusGoalReplacementDialog.message":
    "У вас уже 2 проекта в фокусе. Какой заменить?",
  "focusGoalReplacementDialog.title": "Заменить проект в фокусе",
  "goal.deleteConfirmName": "Удалить проект?",
  "goal.drag": "Перетащить проект",
  "goal.editName": "Редактировать проект",
  "goal.empty": "Нет ни одного проекта",
  "goal.emptyActive": "Нет активных проектов",
  "goal.emptyFinished": "Нет завершённых проектов",
  "goal.emptyPaused": "Нет проектов на паузе",
  "goal.namePlaceholder": "Название проекта",
  "goal.notFound": "Проект не найден",
  "goal.pageName": "Мои проекты",
  "onboarding.dialogBody":
    "Хотите начать с ознакомительного проекта? Мы создадим проект с задачами, которые помогут освоить основные возможности приложения.",
  "onboarding.goalDescription":
    "Выполните задачи ниже, чтобы познакомиться с основными возможностями приложения. После ознакомления удалите этот проект.",
  "search.goals": "Проекты",
  "search.placeholder": "Задачи, проекты и идеи...",
  "selector.goal": "Проект",
  "selector.noGoal": "Без проекта",
  "share.inviteMessage":
    "Попробуй Clear Progress — приложение для работы с задачами, проектами и идеями!",
  "task.selectGoal": "Выбрать проект",
};
