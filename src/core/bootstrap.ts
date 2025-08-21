import appLogger from './log/app.js';

async function bootstrap() {
  try {
    await import('./bot/bot.js');
  } catch (err) {
    appLogger.fatal(err, 'Ошибка при запуске приложения');
    process.exit(1);
  }
}

bootstrap().then();
