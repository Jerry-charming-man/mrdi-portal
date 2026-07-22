/**
 * i18n configuration — S4-1
 * zh-HK (繁中) = primary, zh-CN (简体), en-US (英文)
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import zhHK from './locales/zh-HK.json'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

export const SUPPORTED_LANGUAGES = ['zh-HK', 'zh-CN', 'en-US'] as const
export type SupportedLang = typeof SUPPORTED_LANGUAGES[number]

export const LANG_LABELS: Record<SupportedLang, string> = {
  'zh-HK': '繁中',
  'zh-CN': '简体',
  'en-US': 'EN',
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-HK': { translation: zhHK },
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS },
    },
    // Default: zh-HK (Hong Kong / MRDI primary audience)
    fallbackLng: 'zh-HK',
    // Only whitelist supported languages (don't show unsupported ones)
    supportedLngs: SUPPORTED_LANGUAGES,
    // Interpolation
    interpolation: {
      escapeValue: false,
    },
    // Language detector options
    detection: {
      // Check localStorage first, then browser default
      order: ['localStorage', 'navigator'],
      // Cache language choice in localStorage
      caches: ['localStorage'],
      lookupLocalStorage: 'mrdi-lang',
    },
  })

export default i18n
