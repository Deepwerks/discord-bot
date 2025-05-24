import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import ILanguage from '../../base/interfaces/ILanguage';
import { logger } from '../..';

export const supportedLanguages: ILanguage[] = [
  {
    code: 'en',
    nameEnglish: 'English',
    nameNative: 'English',
  },
];

export async function initI18n() {
  await i18next.use(Backend).init({
    fallbackLng: 'en',
    preload: supportedLanguages.map((l) => l.code),
    backend: {
      loadPath: path.join(process.cwd(), 'locales/{{lng}}/translation.json'),
    },
    interpolation: {
      escapeValue: false,
    },
  });
  logger.info('i18n initialized!');
}

export default i18next;
