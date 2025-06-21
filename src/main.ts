import { Bot, Context, session, SessionFlavor } from "grammy";
import mongoose from "mongoose";
import path from "path";
import { config, Logger } from "./lib";
import BotUpdate from "./updates/BotUpdates";

export interface SessionData {
  waitingForOrientation?: boolean;
  errorMessageIdsOrientation?: number[];
  pendingOrientation?: {
    userId: number;
    callbackMessageId?: number;
  };
}

export type SessionContext = Context & SessionFlavor<SessionData>;

const BOT_CONFIG = config.get("BOT");
const bot = new Bot<SessionContext>(BOT_CONFIG.TOKEN, {
  client: { apiRoot: "https://api.telegram.org" },
});

bot.use(
  session({
    initial: (): SessionData => ({}),
  })
);

bot.use(async (ctx, next) => {
  if (BOT_CONFIG.DEV_MODE && ctx.from?.id !== BOT_CONFIG.ID_DEVELOPER) {
    await ctx.react("⚡");
    return;
  }
  await next();
});

bot.use((ctx) => BotUpdate.run(bot as any, ctx));

bot.catch((err) => Logger.error("Middleware error:", err));

async function bootstrap() {
  try {
    await mongoose.connect(BOT_CONFIG.MONGO_URI, {
      dbName: BOT_CONFIG.DATABASE,
    });
    Logger.success("MongoDB успешно подключен.");

    const modulesPath = path.join(__dirname, "updates");
    await BotUpdate.loadModules(modulesPath);
    Logger.info("Модули успешно загружены.");
    await BotUpdate.register(bot as any);

    await bot.start({
      drop_pending_updates: true,
      allowed_updates: [],
      onStart: (info) => {
        Logger.info(`🚀 Бот запущен как @${info.username}`);
        Logger.info(`⏱️ Дата запуска: ${new Date().toLocaleString("ru-RU")}`);
      },
    });

    const shutdown = () => {
      bot.stop();
      process.exit(0);
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    Logger.error("Критическая ошибка при инициализации:", error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  Logger.error("Необработанная ошибка верхнего уровня:", error);
  process.exit(1);
});
