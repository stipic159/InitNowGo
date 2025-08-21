import pm2 from 'pm2';
import fs from 'fs/promises';
import { config } from './config/config.js';
import appLogger from './log/app.js';
import 'dotenv/config';
import { ApiConfig, LogConfig } from './utils/interfaces/bases.js';

appLogger.debug('🚀 Starting application initialization');

if (!config.secrets.telegramBotApi) {
  appLogger.error('❌ TELEGRAM_BOT_API is not defined in .env');
  process.exit(1);
}
appLogger.debug('✅ Telegram bot API token validated');

async function ensureDir(dirPath: string): Promise<void> {
  appLogger.debug(`📁 Creating directory: ${dirPath}`);
  try {
    await fs.mkdir(dirPath, { recursive: true });
    appLogger.debug(`✅ Directory created successfully: ${dirPath}`);
  } catch {
    appLogger.error(`❌ Failed to create directory: ${dirPath}`);
    throw new Error(`Failed to create directory: ${dirPath}`);
  }
}

function startProcess(config: ApiConfig) {
  appLogger.debug(`🔄 Starting PM2 process: ${config.name}`);
  return new Promise((resolve, reject) => {
    pm2.start(config, (err, apps) => {
      if (err) {
        // @ts-ignore
        appLogger.error(`❌ Failed to start process ${config.name}:`, err);
        reject(err);
      } else {
        appLogger.debug(`✅ Process ${config.name} started successfully`);
        resolve(apps);
      }
    });
  });
}

async function main() {
  appLogger.debug('📂 Ensuring required directories exist');
  await ensureDir(config.paths.tempFiles);
  await ensureDir(config.paths.logsFiles);
  appLogger.debug('✅ All directories ensured');

  appLogger.debug('🔌 Connecting to PM2');
  pm2.connect(async err => {
    if (err) {
      appLogger.error(err, '❌ PM2 connection failed:');
      process.exit(2);
    }
    appLogger.debug('✅ PM2 connection established');

    try {
      appLogger.debug('⚙️ Configuring log paths');
      const logConfig: LogConfig = {
        output:
          '/media/stepan/b02035dd-e9da-44fc-bf45-00369f241928/Projects/GitHub/initnowgo/.logs/output.log',
        error: '/media/stepan/b02035dd-e9da-44fc-bf45-00369f241928/Projects/GitHub/initnowgo/.logs/error.log',
        log: '/media/stepan/b02035dd-e9da-44fc-bf45-00369f241928/Projects/GitHub/initnowgo/.logs/log.log',
      };
      appLogger.debug('✅ Log configuration prepared');

      appLogger.debug(`🔍 Dev mode status: ${config.meta.devMode ? 'enabled' : 'disabled'}`);

      if (!config.meta.devMode) {
        appLogger.debug('🚀 Starting production bot process');
        const startConfig: ApiConfig = {
          name: `${config.secrets.telegramBotApi}`,
          script: config.paths.startApp,
          ...logConfig,
        };
        await startProcess(startConfig);
        appLogger.info(`✅ Started bot`);
      } else {
        appLogger.debug('🔧 Starting development bot process');
        const defaultToken: string = `${config.secrets.telegramBotApi}`;
        const startDevConfig: ApiConfig = {
          name: defaultToken,
          script: config.paths.startApp,
          ...logConfig,
        };
        await startProcess(startDevConfig);
        appLogger.info(`✅ Started default dev bot: ${defaultToken}`);
      }

      /*appLogger.debug('🌐 Starting API process');
      const apiConfig: ApiConfig = {
        name: 'api',
        script: config.paths.startApi,
        ...logConfig,
      };
      await startProcess(apiConfig)*/
      appLogger.info('✅ Started API process');
    } catch (error) {
      appLogger.error(error, '❌ Error while starting processes:');
    } finally {
      appLogger.debug('🔌 Disconnecting from PM2');
      pm2.disconnect();
      appLogger.debug('✅ PM2 disconnected successfully');
    }
  });
}

appLogger.debug('🎯 Executing main function');
main().then();
