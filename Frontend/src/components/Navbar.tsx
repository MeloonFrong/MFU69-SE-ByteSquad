import { Moon, Sun } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

export type ActiveSection = 'feed' | 'datasets' | 'api-docs';

interface NavbarProps {
  activeTab?: ActiveSection;
  setActiveTab?: (tab: ActiveSection) => void;
}

export function Navbar({ setActiveTab }: NavbarProps) {
  const { lang, setLang, theme, setTheme, t } = useI18n();

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand identity */}
        <div className="flex items-center min-w-0">
          <button
            type="button"
            onClick={() => setActiveTab?.('feed')}
            className="flex items-center gap-3 text-left shrink-0"
          >
            <span className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center text-sm font-semibold tracking-tight shrink-0">
              IC
            </span>
            <div className="min-w-0">
              <div className="font-display text-[16px] font-semibold text-ink tracking-tight leading-tight">
                {t('appName')}
              </div>
              <div className="text-[12px] text-ink-3 font-normal leading-tight truncate">
                {t('appTagline')}
              </div>
            </div>
          </button>
        </div>

        {/* Right: Light/Dark Switcher & Bilingual TH/EN Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Light / Dark Mode Switcher */}
          <div
            role="group"
            aria-label={t('themeToggle')}
            className="h-9 p-1 rounded-lg bg-raised border border-line inline-flex items-center gap-0.5"
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
              title={t('themeLight')}
              aria-label={t('themeLight')}
              className={`h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors inline-flex items-center gap-1.5 ${
                theme === 'light'
                  ? 'bg-card text-ink shadow-[var(--shadow-small)]'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Sun className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t('themeLight')}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              title={t('themeDark')}
              aria-label={t('themeDark')}
              className={`h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors inline-flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'bg-card text-ink shadow-[var(--shadow-small)]'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t('themeDark')}</span>
            </button>
          </div>

          {/* Bilingual TH / EN Switcher */}
          <div
            role="group"
            aria-label={t('langSwitch')}
            className="h-9 p-1 rounded-lg bg-raised border border-line inline-flex items-center gap-0.5"
          >
            <button
              type="button"
              onClick={() => setLang('th')}
              aria-pressed={lang === 'th'}
              className={`h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors ${
                lang === 'th'
                  ? 'bg-accent text-white'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              TH
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              className={`h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors ${
                lang === 'en'
                  ? 'bg-accent text-white'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
