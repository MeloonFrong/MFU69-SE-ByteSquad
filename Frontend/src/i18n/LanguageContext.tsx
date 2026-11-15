import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STRINGS, type Lang, type StringKey } from './strings';

const LANG_STORAGE_KEY = 'infocenter_lang';
const THEME_STORAGE_KEY = 'infocenter_theme';

export type ThemeMode = 'light' | 'dark';

type Params = Record<string, string | number>;

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  t: (key: StringKey, params?: Params) => string;
  locale: string;
  formatNumber: (n: number) => string;
  formatDateTime: (ms: number) => string;
  formatPostTimestamp: (ms: number) => string;
  formatTime: (ms: number) => string;
  formatRelative: (ms: number) => string;
}

const I18nContext = createContext<I18n | null>(null);

function readStoredLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'th' || saved === 'en') return saved;
  } catch {
    // ignore
  }
  return 'th';
}

function readStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }
  return 'light';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === 'th'
        ? 'InfoCenter · รวมทุกฟีดโซเชียลไว้ในที่เดียว'
        : 'InfoCenter · Unified Social Feed Aggregator';
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const value = useMemo<I18n>(() => {
    const locale = lang === 'th' ? 'th-TH' : 'en-GB';
    const dict = STRINGS[lang];
    const t = (key: StringKey, params?: Params) => {
      let s = dict[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          s = s.split(`{${k}}`).join(String(v));
        }
      }
      return s;
    };

    const numberFmt = new Intl.NumberFormat(locale);
    const dateFmt = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeFmt = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const dateTimeFmt = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    const formatPostTimestamp = (ms: number) => {
      const d = dateFmt.format(ms);
      const hm = timeFmt.format(ms);
      return lang === 'th' ? `${d} · ${hm} น.` : `${d} · ${hm}`;
    };

    const formatRelative = (ms: number) => {
      const diffSec = Math.round((Date.now() - ms) / 1000);
      if (diffSec < 0) return '';
      if (diffSec < 60) return t('justNow');
      if (diffSec < 3600) return rtf.format(-Math.floor(diffSec / 60), 'minute');
      if (diffSec < 86400) return rtf.format(-Math.floor(diffSec / 3600), 'hour');
      if (diffSec < 30 * 86400) return rtf.format(-Math.floor(diffSec / 86400), 'day');
      if (diffSec < 365 * 86400) return rtf.format(-Math.floor(diffSec / (30 * 86400)), 'month');
      return rtf.format(-Math.floor(diffSec / (365 * 86400)), 'year');
    };

    return {
      lang,
      setLang,
      theme,
      setTheme,
      toggleTheme,
      t,
      locale,
      formatNumber: (n) => numberFmt.format(n),
      formatDateTime: (ms) => dateTimeFmt.format(ms),
      formatPostTimestamp,
      formatTime: (ms) => timeFmt.format(ms),
      formatRelative,
    };
  }, [lang, setLang, theme, setTheme, toggleTheme]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside LanguageProvider');
  return ctx;
}
