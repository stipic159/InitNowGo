import { Bot } from 'grammy';
import { config } from '../config/config.js';
import appLogger from '../log/app.js';
import Logger from '../log/app.js';

async function main() {
  if (!config.secrets.telegramBotApi) {
    appLogger.error('❌ TELEGRAM_BOT_API is not defined in .env');
    process.exit(1);
  }
  const bot: Bot = new Bot(config.secrets.telegramBotApi);
  bot.command('start', ctx => {
    Logger.info('Кто то написал команду старт');
    ctx.reply('Добро пожаловать. Запущен и работает!');
  });
  bot.on('message', ctx => {
    Logger.info('Бот получил другое сообщение!');
    ctx.reply('Получил другое сообщение!');
  });
}
main().then();
