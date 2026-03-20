import { useMemo } from 'react';
import { useStore } from '@/store';
import { translations, isRTL } from './translations';
import type { TranslationStrings } from './translations';
import type { Language } from '@/types';

/**
 * Returns translated strings for contractor users only.
 * Non-contractor users always get English (default) strings.
 */
export function useTranslation(): {
  t: TranslationStrings;
  language: Language;
  isContractor: boolean;
  rtl: boolean;
} {
  const currentUser = useStore((s) => s.currentUser);

  return useMemo(() => {
    const isContractor = currentUser?.userType === 'Contract';
    const language: Language = isContractor && currentUser?.language ? currentUser.language : 'en';
    return {
      t: translations[language],
      language,
      isContractor,
      rtl: isRTL(language),
    };
  }, [currentUser?.userType, currentUser?.language]);
}
