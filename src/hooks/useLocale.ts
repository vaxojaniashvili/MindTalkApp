import { useTranslation } from 'react-i18next';
import type { Translatable } from '../types';

export function useLocale() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'ka' | 'en' | 'ru';

  const t = (translatable: Translatable | null | undefined): string => {
    if (!translatable) return '';
    return translatable[lang] || translatable.ka || translatable.en || '';
  };

  return { lang, localize: t };
}
