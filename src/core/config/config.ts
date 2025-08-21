import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export const getCurrentFilename = () => fileURLToPath(import.meta.url);
export const getCurrentDirname = () => dirname(fileURLToPath(import.meta.url));

export const __filename = getCurrentFilename();
export const __dirname = getCurrentDirname();

const rootDir = path.join(__dirname, '../../../');
const pkgJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf-8'));

const isDev = process.env.NODE_ENV === 'dev';

export const config = {
  meta: {
    version: pkgJson.version,
    devMode: isDev,
    port: Number(process.env.PORT) || 3000,
  },

  constants: {
    idDeveloper: process.env.ID_DEVELOPER || '',
    supportId: process.env.SUPPORT_ID || '',
  },

  paths: {
    __filename: getCurrentFilename(),
    __dirname: getCurrentDirname(),
    root: rootDir,
    startApp: path.join(rootDir, 'dist/core/bootstrap.js'),
    startApi: path.join(rootDir, 'dist/api/bootstrap.js'),
    plugins: path.join(rootDir, 'dist/plugins'),
    tempFiles: path.join(rootDir, '.tmp'),
    sessions: path.join(rootDir, '.sessions'),
    logsFiles: path.join(rootDir, '.logs'),
  },

  secrets: {
    telegramBotApi: process.env.TELEGRAM_BOT_API,
    mongoUri: process.env.MONGO_URI,
    telegramHashApi: process.env.TELEGRAM_HASH_API,
    telegramIdApi: process.env.TELEGRAM_ID_API,
    //genApiKey: process.env.GEN_API_KEY,
    //yookassa: {
    //  shopId: process.env.YOOKASSA_SHOP_ID,
    //  secretKey: process.env.YOOKASSA_SECRET_KEY,
    //},
    //yandex: {
    //  folderId: process.env.YANDEX_FOLDER_ID,
    //  oauthToken: process.env.YANDEX_PASSPORT_OAUTH_TOKEN,
    //},
    //mailer: {
    //  user: process.env.MAILER_AUTH_USER,
    //  pass: process.env.MAILER_AUTH_PASS,
    //},
  },
  pricing: {},

  logLevelConsole: process.env.LOG_LEVEL_CONSOLE || 'debug',
};
