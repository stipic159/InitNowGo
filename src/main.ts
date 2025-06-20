import { Bot, Context, session } from "grammy";
import mongoose from "mongoose";
import path from "path";
import { config } from "./config/env.config";
import BotUpdate from "./updates/BotUpdates";
import { Logger } from "./utils/Logger.utils";

export interface SessionData {
  waitingForOrientation?: boolean;
  errorMessageIdsOrientation?: number[];
  pendingOrientation?: {
    userId: number;
    callbackMessageId?: number;
  };
}

export interface SessionContext extends Context {
  session: SessionData;
}

const bot = new Bot<SessionContext>(config.get("BOT").TOKEN, {
  client: {
    apiRoot: "https://api.telegram.org",
  },
});

async function bootstrap() {
  try {
    await mongoose.connect(config.get("BOT").MONGO_URI);
    Logger.success("MongoDB успешно подключен.");
    await BotUpdate.loadModules(path.join(__dirname, "updates"));
    Logger.info("Модули успешно загружены.");

    await BotUpdate.register(bot);

    await bot.start({
      drop_pending_updates: true,
      allowed_updates: [],
      onStart: (info) => {
        Logger.info(`🚀 Бот запущен как @${info.username}`);
        Logger.info(`⏱️ Дата запуска: ${new Date().toLocaleString("ru-RU")}`);
      },
    });

    process.once("SIGINT", () => {
      bot.stop();
      process.exit(0);
    });
    process.once("SIGTERM", () => {
      bot.stop();
      process.exit(0);
    });
  } catch (error) {
    Logger.error("Критическая ошибка при инициализации:", error);
    process.exit(1);
  }
}

bot.use((ctx, next) => {
  if (
    config.get("BOT").DEV_MODE &&
    !(ctx?.from?.id === config.get("BOT").ID_DEVELOPER)
  ) {
    ctx.react("⚡");
  } else {
    return next();
  }
});

bot.use(
  session({
    initial: () => ({}),
  })
);

bot.use(async (ctx: Context) => {
  await BotUpdate.run(bot, ctx);
});

bot.catch((err) => {
  Logger.error("Middleware error:", err);
});

bootstrap().catch((error) => {
  Logger.error("Необработанная ошибка верхнего уровня:", error);
  process.exit(1);
});
