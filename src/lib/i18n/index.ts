// ── Lightweight i18n system ───────────────────────────────────────────────
// No external dependencies. Add more locales to the LOCALES map.

export type Locale = 'en' | 'es' | 'fr' | 'zh' | 'ja' | 'pt' | 'de' | 'ar';

export interface Messages {
  // Nav
  nav_dashboard:     string;
  nav_discover:      string;
  nav_gallery:       string;
  nav_games:         string;
  nav_world:         string;
  nav_challenges:    string;
  nav_marketplace:   string;
  nav_communities:   string;
  nav_learn:         string;
  // Actions
  action_create:     string;
  action_save:       string;
  action_delete:     string;
  action_cancel:     string;
  action_join:       string;
  action_leave:      string;
  action_follow:     string;
  action_unfollow:   string;
  action_like:       string;
  action_share:      string;
  action_upgrade:    string;
  // States
  state_loading:     string;
  state_empty:       string;
  state_error:       string;
  state_success:     string;
  // Drawing
  draw_new:          string;
  draw_export:       string;
  draw_undo:         string;
  draw_redo:         string;
  draw_clear:        string;
  // AI
  ai_thinking:       string;
  ai_generate:       string;
  ai_agent_mentor:   string;
  // Misc
  xp_level:          string;
  daily_challenge:   string;
  sign_in:           string;
  sign_out:          string;
}

const LOCALES: Record<Locale, Messages> = {
  en: {
    nav_dashboard: 'Dashboard',   nav_discover: 'Discover',    nav_gallery: 'Gallery',
    nav_games: 'Games',           nav_world: 'World',          nav_challenges: 'Challenges',
    nav_marketplace: 'Marketplace', nav_communities: 'Communities', nav_learn: 'Learn',
    action_create: 'Create',      action_save: 'Save',         action_delete: 'Delete',
    action_cancel: 'Cancel',      action_join: 'Join',         action_leave: 'Leave',
    action_follow: 'Follow',      action_unfollow: 'Unfollow', action_like: 'Like',
    action_share: 'Share',        action_upgrade: 'Upgrade',
    state_loading: 'Loading…',    state_empty: 'Nothing here yet', state_error: 'Something went wrong',
    state_success: 'Done!',
    draw_new: 'New Drawing',      draw_export: 'Export',       draw_undo: 'Undo',
    draw_redo: 'Redo',            draw_clear: 'Clear',
    ai_thinking: 'Thinking…',     ai_generate: 'Generate',     ai_agent_mentor: 'Sketch Mentor',
    xp_level: 'Level',            daily_challenge: 'Daily Challenge',
    sign_in: 'Sign In',           sign_out: 'Sign Out',
  },
  es: {
    nav_dashboard: 'Panel',         nav_discover: 'Descubrir',     nav_gallery: 'Galería',
    nav_games: 'Juegos',            nav_world: 'Mundo',            nav_challenges: 'Retos',
    nav_marketplace: 'Mercado',     nav_communities: 'Comunidades', nav_learn: 'Aprender',
    action_create: 'Crear',         action_save: 'Guardar',        action_delete: 'Eliminar',
    action_cancel: 'Cancelar',      action_join: 'Unirse',         action_leave: 'Salir',
    action_follow: 'Seguir',        action_unfollow: 'Dejar de seguir', action_like: 'Me gusta',
    action_share: 'Compartir',      action_upgrade: 'Mejorar',
    state_loading: 'Cargando…',     state_empty: 'Aún nada aquí', state_error: 'Algo salió mal',
    state_success: '¡Listo!',
    draw_new: 'Nuevo dibujo',       draw_export: 'Exportar',       draw_undo: 'Deshacer',
    draw_redo: 'Rehacer',           draw_clear: 'Limpiar',
    ai_thinking: 'Pensando…',       ai_generate: 'Generar',        ai_agent_mentor: 'Mentor de bocetos',
    xp_level: 'Nivel',              daily_challenge: 'Reto diario',
    sign_in: 'Iniciar sesión',      sign_out: 'Cerrar sesión',
  },
  fr: {
    nav_dashboard: 'Tableau de bord', nav_discover: 'Découvrir',  nav_gallery: 'Galerie',
    nav_games: 'Jeux',               nav_world: 'Monde',          nav_challenges: 'Défis',
    nav_marketplace: 'Marché',       nav_communities: 'Communautés', nav_learn: 'Apprendre',
    action_create: 'Créer',          action_save: 'Sauvegarder',  action_delete: 'Supprimer',
    action_cancel: 'Annuler',        action_join: 'Rejoindre',    action_leave: 'Quitter',
    action_follow: 'Suivre',         action_unfollow: 'Ne plus suivre', action_like: 'Aimer',
    action_share: 'Partager',        action_upgrade: 'Améliorer',
    state_loading: 'Chargement…',    state_empty: 'Rien ici encore', state_error: 'Une erreur est survenue',
    state_success: 'Terminé!',
    draw_new: 'Nouveau dessin',      draw_export: 'Exporter',     draw_undo: 'Annuler',
    draw_redo: 'Rétablir',           draw_clear: 'Effacer',
    ai_thinking: 'Réflexion…',       ai_generate: 'Générer',      ai_agent_mentor: 'Mentor croquis',
    xp_level: 'Niveau',              daily_challenge: 'Défi du jour',
    sign_in: 'Se connecter',         sign_out: 'Se déconnecter',
  },
  zh: {
    nav_dashboard: '仪表板',   nav_discover: '发现',      nav_gallery: '画廊',
    nav_games: '游戏',        nav_world: '世界',         nav_challenges: '挑战',
    nav_marketplace: '市场',  nav_communities: '社区',   nav_learn: '学习',
    action_create: '创建',    action_save: '保存',       action_delete: '删除',
    action_cancel: '取消',    action_join: '加入',       action_leave: '离开',
    action_follow: '关注',    action_unfollow: '取消关注', action_like: '点赞',
    action_share: '分享',     action_upgrade: '升级',
    state_loading: '加载中…', state_empty: '暂无内容',   state_error: '出错了',
    state_success: '完成！',
    draw_new: '新建画作',     draw_export: '导出',       draw_undo: '撤销',
    draw_redo: '重做',        draw_clear: '清除',
    ai_thinking: '思考中…',   ai_generate: '生成',       ai_agent_mentor: '素描导师',
    xp_level: '等级',         daily_challenge: '每日挑战',
    sign_in: '登录',          sign_out: '登出',
  },
  ja: {
    nav_dashboard: 'ダッシュボード', nav_discover: '発見',    nav_gallery: 'ギャラリー',
    nav_games: 'ゲーム',           nav_world: 'ワールド',   nav_challenges: 'チャレンジ',
    nav_marketplace: 'マーケット', nav_communities: 'コミュニティ', nav_learn: '学ぶ',
    action_create: '作成',         action_save: '保存',      action_delete: '削除',
    action_cancel: 'キャンセル',   action_join: '参加',      action_leave: '退出',
    action_follow: 'フォロー',     action_unfollow: 'フォロー解除', action_like: 'いいね',
    action_share: '共有',          action_upgrade: 'アップグレード',
    state_loading: '読込中…',      state_empty: 'まだ何もありません', state_error: 'エラーが発生しました',
    state_success: '完了！',
    draw_new: '新しい絵',          draw_export: 'エクスポート', draw_undo: '元に戻す',
    draw_redo: 'やり直し',         draw_clear: 'クリア',
    ai_thinking: '考え中…',        ai_generate: '生成',       ai_agent_mentor: 'スケッチメンター',
    xp_level: 'レベル',            daily_challenge: '今日のチャレンジ',
    sign_in: 'サインイン',         sign_out: 'サインアウト',
  },
  pt: {} as Messages,
  de: {} as Messages,
  ar: {} as Messages,
};

// Fill in missing locales with English fallback
(['pt', 'de', 'ar'] as const).forEach(locale => {
  LOCALES[locale] = { ...LOCALES.en };
});

// ── React hook / context ──────────────────────────────────────
let currentLocale: Locale = (localStorage.getItem('pc_locale') as Locale) ?? 'en';

export function getLocale(): Locale { return currentLocale; }

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  localStorage.setItem('pc_locale', locale);
  document.documentElement.lang = locale;
  document.documentElement.dir  = locale === 'ar' ? 'rtl' : 'ltr';
}

export function t(key: keyof Messages, locale?: Locale): string {
  const l = locale ?? currentLocale;
  return LOCALES[l]?.[key] ?? LOCALES.en[key] ?? key;
}

export const SUPPORTED_LOCALES: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English',    flag: '🇺🇸' },
  { code: 'es', name: 'Español',    flag: '🇪🇸' },
  { code: 'fr', name: 'Français',   flag: '🇫🇷' },
  { code: 'zh', name: '中文',       flag: '🇨🇳' },
  { code: 'ja', name: '日本語',     flag: '🇯🇵' },
  { code: 'pt', name: 'Português',  flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch',    flag: '🇩🇪' },
  { code: 'ar', name: 'العربية',    flag: '🇸🇦' },
];
