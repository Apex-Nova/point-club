// Lightweight i18n system — no external dependency required
// Supports dynamic locale switching and nested keys

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'pt' | 'zh' | 'ko' | 'ar' | 'hi';

type Translations = Record<string, Record<string, string>>;

const translations: Record<Locale, Translations> = {
  en: {
    nav: {
      home: 'Home', discover: 'Discover', create: 'Create', learn: 'Learn',
      marketplace: 'Marketplace', communities: 'Communities', events: 'Events',
      workspace: 'Workspace', settings: 'Settings', logout: 'Sign Out',
    },
    common: {
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
      create: 'Create', share: 'Share', loading: 'Loading…', error: 'Error',
      success: 'Success', confirm: 'Confirm', back: 'Back', next: 'Next',
      search: 'Search', filter: 'Filter', sort: 'Sort', view: 'View',
    },
    drawing: {
      title: 'Drawing', untitled: 'Untitled Drawing', save: 'Save Drawing',
      export: 'Export', undo: 'Undo', redo: 'Redo', clear: 'Clear Canvas',
    },
    auth: {
      login: 'Sign In', signup: 'Create Account', logout: 'Sign Out',
      email: 'Email', password: 'Password', forgotPassword: 'Forgot password?',
    },
    events: {
      globalArtWeek: 'Global Art Week', worldCanvas: 'World Canvas Festival',
      monthlyChallenge: 'Monthly Challenge', competition: 'Creator Competition',
      joinEvent: 'Join Event', registered: 'Registered', upcoming: 'Upcoming',
      live: 'Live Now', ended: 'Ended', participants: 'participants',
    },
    learn: {
      courses: 'Courses', workshops: 'Workshops', tutorials: 'Tutorials',
      certifications: 'Certifications', enroll: 'Enroll', continue: 'Continue',
      completed: 'Completed', progress: 'Progress', lessons: 'lessons',
    },
  },
  es: {
    nav: {
      home: 'Inicio', discover: 'Descubrir', create: 'Crear', learn: 'Aprender',
      marketplace: 'Mercado', communities: 'Comunidades', events: 'Eventos',
      workspace: 'Espacio', settings: 'Ajustes', logout: 'Cerrar sesión',
    },
    common: {
      save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar',
      create: 'Crear', share: 'Compartir', loading: 'Cargando…', error: 'Error',
      success: 'Éxito', confirm: 'Confirmar', back: 'Volver', next: 'Siguiente',
      search: 'Buscar', filter: 'Filtrar', sort: 'Ordenar', view: 'Ver',
    },
    drawing: {
      title: 'Dibujo', untitled: 'Dibujo sin título', save: 'Guardar dibujo',
      export: 'Exportar', undo: 'Deshacer', redo: 'Rehacer', clear: 'Limpiar',
    },
    auth: {
      login: 'Iniciar sesión', signup: 'Crear cuenta', logout: 'Cerrar sesión',
      email: 'Correo', password: 'Contraseña', forgotPassword: '¿Olvidaste tu contraseña?',
    },
    events: {
      globalArtWeek: 'Semana Global del Arte', worldCanvas: 'Festival del Lienzo Mundial',
      monthlyChallenge: 'Desafío Mensual', competition: 'Competencia de Creadores',
      joinEvent: 'Unirse al Evento', registered: 'Registrado', upcoming: 'Próximo',
      live: 'En Vivo', ended: 'Terminado', participants: 'participantes',
    },
    learn: {
      courses: 'Cursos', workshops: 'Talleres', tutorials: 'Tutoriales',
      certifications: 'Certificaciones', enroll: 'Inscribirse', continue: 'Continuar',
      completed: 'Completado', progress: 'Progreso', lessons: 'lecciones',
    },
  },
  fr: {
    nav: {
      home: 'Accueil', discover: 'Découvrir', create: 'Créer', learn: 'Apprendre',
      marketplace: 'Marché', communities: 'Communautés', events: 'Événements',
      workspace: 'Espace', settings: 'Paramètres', logout: 'Déconnexion',
    },
    common: {
      save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier',
      create: 'Créer', share: 'Partager', loading: 'Chargement…', error: 'Erreur',
      success: 'Succès', confirm: 'Confirmer', back: 'Retour', next: 'Suivant',
      search: 'Rechercher', filter: 'Filtrer', sort: 'Trier', view: 'Voir',
    },
    drawing: {
      title: 'Dessin', untitled: 'Dessin sans titre', save: 'Enregistrer',
      export: 'Exporter', undo: 'Annuler', redo: 'Rétablir', clear: 'Effacer',
    },
    auth: {
      login: 'Se connecter', signup: 'Créer un compte', logout: 'Déconnexion',
      email: 'Email', password: 'Mot de passe', forgotPassword: 'Mot de passe oublié ?',
    },
    events: {
      globalArtWeek: 'Semaine Mondiale de l\'Art', worldCanvas: 'Festival Mondial de la Toile',
      monthlyChallenge: 'Défi Mensuel', competition: 'Compétition des Créateurs',
      joinEvent: 'Rejoindre l\'événement', registered: 'Inscrit', upcoming: 'À venir',
      live: 'En Direct', ended: 'Terminé', participants: 'participants',
    },
    learn: {
      courses: 'Cours', workshops: 'Ateliers', tutorials: 'Tutoriels',
      certifications: 'Certifications', enroll: 'S\'inscrire', continue: 'Continuer',
      completed: 'Terminé', progress: 'Progrès', lessons: 'leçons',
    },
  },
  de: {
    nav: {
      home: 'Startseite', discover: 'Entdecken', create: 'Erstellen', learn: 'Lernen',
      marketplace: 'Marktplatz', communities: 'Gemeinschaften', events: 'Veranstaltungen',
      workspace: 'Arbeitsbereich', settings: 'Einstellungen', logout: 'Abmelden',
    },
    common: {
      save: 'Speichern', cancel: 'Abbrechen', delete: 'Löschen', edit: 'Bearbeiten',
      create: 'Erstellen', share: 'Teilen', loading: 'Laden…', error: 'Fehler',
      success: 'Erfolg', confirm: 'Bestätigen', back: 'Zurück', next: 'Weiter',
      search: 'Suchen', filter: 'Filtern', sort: 'Sortieren', view: 'Ansehen',
    },
    drawing: {
      title: 'Zeichnung', untitled: 'Unbenannte Zeichnung', save: 'Speichern',
      export: 'Exportieren', undo: 'Rückgängig', redo: 'Wiederholen', clear: 'Löschen',
    },
    auth: {
      login: 'Anmelden', signup: 'Konto erstellen', logout: 'Abmelden',
      email: 'E-Mail', password: 'Passwort', forgotPassword: 'Passwort vergessen?',
    },
    events: {
      globalArtWeek: 'Globale Kunstwoche', worldCanvas: 'Welt-Leinwand-Festival',
      monthlyChallenge: 'Monatliche Herausforderung', competition: 'Schöpfer-Wettbewerb',
      joinEvent: 'Event beitreten', registered: 'Angemeldet', upcoming: 'Bevorstehend',
      live: 'Jetzt live', ended: 'Beendet', participants: 'Teilnehmer',
    },
    learn: {
      courses: 'Kurse', workshops: 'Workshops', tutorials: 'Tutorials',
      certifications: 'Zertifikate', enroll: 'Einschreiben', continue: 'Fortfahren',
      completed: 'Abgeschlossen', progress: 'Fortschritt', lessons: 'Lektionen',
    },
  },
  ja: {
    nav: {
      home: 'ホーム', discover: '発見', create: '作成', learn: '学ぶ',
      marketplace: 'マーケット', communities: 'コミュニティ', events: 'イベント',
      workspace: 'ワークスペース', settings: '設定', logout: 'ログアウト',
    },
    common: {
      save: '保存', cancel: 'キャンセル', delete: '削除', edit: '編集',
      create: '作成', share: '共有', loading: '読み込み中…', error: 'エラー',
      success: '成功', confirm: '確認', back: '戻る', next: '次へ',
      search: '検索', filter: 'フィルター', sort: '並べ替え', view: '表示',
    },
    drawing: {
      title: '描画', untitled: '無題の描画', save: '描画を保存',
      export: 'エクスポート', undo: '元に戻す', redo: 'やり直す', clear: 'クリア',
    },
    auth: {
      login: 'ログイン', signup: 'アカウント作成', logout: 'ログアウト',
      email: 'メール', password: 'パスワード', forgotPassword: 'パスワードを忘れた？',
    },
    events: {
      globalArtWeek: 'グローバルアート週間', worldCanvas: 'ワールドキャンバスフェスティバル',
      monthlyChallenge: '月間チャレンジ', competition: 'クリエイターコンペ',
      joinEvent: 'イベントに参加', registered: '登録済み', upcoming: '近日公開',
      live: 'ライブ中', ended: '終了', participants: '参加者',
    },
    learn: {
      courses: 'コース', workshops: 'ワークショップ', tutorials: 'チュートリアル',
      certifications: '認定資格', enroll: '登録', continue: '続ける',
      completed: '完了', progress: '進捗', lessons: 'レッスン',
    },
  },
  pt: {
    nav: {
      home: 'Início', discover: 'Descobrir', create: 'Criar', learn: 'Aprender',
      marketplace: 'Mercado', communities: 'Comunidades', events: 'Eventos',
      workspace: 'Espaço', settings: 'Configurações', logout: 'Sair',
    },
    common: {
      save: 'Salvar', cancel: 'Cancelar', delete: 'Excluir', edit: 'Editar',
      create: 'Criar', share: 'Compartilhar', loading: 'Carregando…', error: 'Erro',
      success: 'Sucesso', confirm: 'Confirmar', back: 'Voltar', next: 'Próximo',
      search: 'Pesquisar', filter: 'Filtrar', sort: 'Ordenar', view: 'Ver',
    },
    drawing: {
      title: 'Desenho', untitled: 'Desenho sem título', save: 'Salvar',
      export: 'Exportar', undo: 'Desfazer', redo: 'Refazer', clear: 'Limpar',
    },
    auth: {
      login: 'Entrar', signup: 'Criar conta', logout: 'Sair',
      email: 'Email', password: 'Senha', forgotPassword: 'Esqueceu a senha?',
    },
    events: {
      globalArtWeek: 'Semana Global de Arte', worldCanvas: 'Festival de Tela Mundial',
      monthlyChallenge: 'Desafio Mensal', competition: 'Competição de Criadores',
      joinEvent: 'Participar do Evento', registered: 'Registrado', upcoming: 'Em breve',
      live: 'Ao Vivo', ended: 'Encerrado', participants: 'participantes',
    },
    learn: {
      courses: 'Cursos', workshops: 'Workshops', tutorials: 'Tutoriais',
      certifications: 'Certificações', enroll: 'Matricular', continue: 'Continuar',
      completed: 'Concluído', progress: 'Progresso', lessons: 'aulas',
    },
  },
  zh: {
    nav: {
      home: '首页', discover: '发现', create: '创作', learn: '学习',
      marketplace: '市场', communities: '社区', events: '活动',
      workspace: '工作区', settings: '设置', logout: '退出',
    },
    common: {
      save: '保存', cancel: '取消', delete: '删除', edit: '编辑',
      create: '创建', share: '分享', loading: '加载中…', error: '错误',
      success: '成功', confirm: '确认', back: '返回', next: '下一步',
      search: '搜索', filter: '筛选', sort: '排序', view: '查看',
    },
    drawing: {
      title: '绘画', untitled: '未命名绘画', save: '保存绘画',
      export: '导出', undo: '撤销', redo: '重做', clear: '清除',
    },
    auth: {
      login: '登录', signup: '注册', logout: '退出',
      email: '邮箱', password: '密码', forgotPassword: '忘记密码？',
    },
    events: {
      globalArtWeek: '全球艺术周', worldCanvas: '世界画布节',
      monthlyChallenge: '月度挑战', competition: '创作者竞赛',
      joinEvent: '加入活动', registered: '已报名', upcoming: '即将开始',
      live: '进行中', ended: '已结束', participants: '参与者',
    },
    learn: {
      courses: '课程', workshops: '工作坊', tutorials: '教程',
      certifications: '认证', enroll: '报名', continue: '继续',
      completed: '已完成', progress: '进度', lessons: '课',
    },
  },
  ko: {
    nav: {
      home: '홈', discover: '탐색', create: '만들기', learn: '배우기',
      marketplace: '마켓플레이스', communities: '커뮤니티', events: '이벤트',
      workspace: '워크스페이스', settings: '설정', logout: '로그아웃',
    },
    common: {
      save: '저장', cancel: '취소', delete: '삭제', edit: '편집',
      create: '만들기', share: '공유', loading: '로딩 중…', error: '오류',
      success: '성공', confirm: '확인', back: '뒤로', next: '다음',
      search: '검색', filter: '필터', sort: '정렬', view: '보기',
    },
    drawing: {
      title: '드로잉', untitled: '제목 없는 드로잉', save: '저장',
      export: '내보내기', undo: '실행 취소', redo: '다시 실행', clear: '지우기',
    },
    auth: {
      login: '로그인', signup: '계정 만들기', logout: '로그아웃',
      email: '이메일', password: '비밀번호', forgotPassword: '비밀번호를 잊으셨나요?',
    },
    events: {
      globalArtWeek: '글로벌 아트 위크', worldCanvas: '월드 캔버스 페스티벌',
      monthlyChallenge: '월간 챌린지', competition: '크리에이터 대회',
      joinEvent: '이벤트 참가', registered: '등록됨', upcoming: '예정',
      live: '진행 중', ended: '종료됨', participants: '참가자',
    },
    learn: {
      courses: '과정', workshops: '워크샵', tutorials: '튜토리얼',
      certifications: '인증', enroll: '등록', continue: '계속',
      completed: '완료', progress: '진행', lessons: '레슨',
    },
  },
  ar: {
    nav: {
      home: 'الرئيسية', discover: 'اكتشاف', create: 'إنشاء', learn: 'تعلم',
      marketplace: 'السوق', communities: 'المجتمعات', events: 'الفعاليات',
      workspace: 'مساحة العمل', settings: 'الإعدادات', logout: 'تسجيل الخروج',
    },
    common: {
      save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل',
      create: 'إنشاء', share: 'مشاركة', loading: 'جاري التحميل…', error: 'خطأ',
      success: 'نجاح', confirm: 'تأكيد', back: 'رجوع', next: 'التالي',
      search: 'بحث', filter: 'تصفية', sort: 'ترتيب', view: 'عرض',
    },
    drawing: {
      title: 'رسم', untitled: 'رسم بدون عنوان', save: 'حفظ الرسم',
      export: 'تصدير', undo: 'تراجع', redo: 'إعادة', clear: 'مسح',
    },
    auth: {
      login: 'تسجيل الدخول', signup: 'إنشاء حساب', logout: 'تسجيل الخروج',
      email: 'البريد الإلكتروني', password: 'كلمة المرور', forgotPassword: 'نسيت كلمة المرور؟',
    },
    events: {
      globalArtWeek: 'أسبوع الفن العالمي', worldCanvas: 'مهرجان اللوحة العالمية',
      monthlyChallenge: 'التحدي الشهري', competition: 'مسابقة المبدعين',
      joinEvent: 'الانضمام للفعالية', registered: 'مسجل', upcoming: 'قادم',
      live: 'مباشر الآن', ended: 'منتهي', participants: 'مشارك',
    },
    learn: {
      courses: 'دورات', workshops: 'ورش عمل', tutorials: 'دروس تعليمية',
      certifications: 'شهادات', enroll: 'تسجيل', continue: 'متابعة',
      completed: 'مكتمل', progress: 'تقدم', lessons: 'دروس',
    },
  },
  hi: {
    nav: {
      home: 'होम', discover: 'खोजें', create: 'बनाएं', learn: 'सीखें',
      marketplace: 'बाज़ार', communities: 'समुदाय', events: 'इवेंट',
      workspace: 'वर्कस्पेस', settings: 'सेटिंग्स', logout: 'साइन आउट',
    },
    common: {
      save: 'सेव', cancel: 'रद्द करें', delete: 'हटाएं', edit: 'संपादित करें',
      create: 'बनाएं', share: 'शेयर', loading: 'लोड हो रहा है…', error: 'त्रुटि',
      success: 'सफलता', confirm: 'पुष्टि करें', back: 'वापस', next: 'अगला',
      search: 'खोजें', filter: 'फ़िल्टर', sort: 'क्रमबद्ध', view: 'देखें',
    },
    drawing: {
      title: 'ड्रॉइंग', untitled: 'बिना शीर्षक ड्रॉइंग', save: 'ड्रॉइंग सेव करें',
      export: 'निर्यात', undo: 'पूर्ववत', redo: 'फिर करें', clear: 'साफ़ करें',
    },
    auth: {
      login: 'साइन इन', signup: 'खाता बनाएं', logout: 'साइन आउट',
      email: 'ईमेल', password: 'पासवर्ड', forgotPassword: 'पासवर्ड भूल गए?',
    },
    events: {
      globalArtWeek: 'वैश्विक कला सप्ताह', worldCanvas: 'विश्व कैनवास महोत्सव',
      monthlyChallenge: 'मासिक चैलेंज', competition: 'क्रिएटर प्रतियोगिता',
      joinEvent: 'इवेंट जॉइन करें', registered: 'पंजीकृत', upcoming: 'आगामी',
      live: 'अभी लाइव', ended: 'समाप्त', participants: 'प्रतिभागी',
    },
    learn: {
      courses: 'पाठ्यक्रम', workshops: 'वर्कशॉप', tutorials: 'ट्यूटोरियल',
      certifications: 'प्रमाणपत्र', enroll: 'नामांकन', continue: 'जारी रखें',
      completed: 'पूर्ण', progress: 'प्रगति', lessons: 'पाठ',
    },
  },
};

const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch',
  ja: '日本語', pt: 'Português', zh: '中文', ko: '한국어', ar: 'العربية', hi: 'हिंदी',
};

const RTL_LOCALES: Locale[] = ['ar'];

let currentLocale: Locale = 'en';
const listeners: Set<() => void> = new Set();

function detectLocale(): Locale {
  const saved = localStorage.getItem('pc_locale') as Locale | null;
  if (saved && saved in translations) return saved;
  const browser = navigator.language.split('-')[0] as Locale;
  return browser in translations ? browser : 'en';
}

export function initLocale() {
  currentLocale = detectLocale();
  applyDirection();
}

function applyDirection() {
  document.documentElement.dir = RTL_LOCALES.includes(currentLocale) ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  localStorage.setItem('pc_locale', locale);
  applyDirection();
  listeners.forEach(fn => fn());
}

export function getLocale(): Locale { return currentLocale; }
export function getLocaleName(l: Locale) { return LOCALE_NAMES[l]; }
export function isRTL() { return RTL_LOCALES.includes(currentLocale); }
export function getAllLocales(): Locale[] { return Object.keys(LOCALE_NAMES) as Locale[]; }

export function t(namespace: string, key: string, fallback?: string): string {
  return translations[currentLocale]?.[namespace]?.[key]
    ?? translations.en?.[namespace]?.[key]
    ?? fallback
    ?? key;
}

export function useLocale() {
  const [, setTick] = (typeof window !== 'undefined'
    ? require('react').useState
    : (v: unknown) => [v, () => {}])(0);

  (typeof window !== 'undefined' ? require('react').useEffect : () => {})(() => {
    const handler = () => setTick((n: number) => n + 1);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  return { locale: currentLocale, setLocale, t, getLocaleName, getAllLocales, isRTL };
}
