import { Bot, Context } from "grammy";
import { ModuleParams } from "../updates/BotUpdates";
import { sck1 } from "./database";

export function isGroup(ctx?: Context): boolean {
  return ctx?.chat?.type === "supergroup" || ctx?.chat?.type === "group";
}

export async function updateUserData(ctx: Context, commandPlugin?: ModuleParams): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const user = await sck1.findOne({ id: userId });
  if (!user) return;

  if (ctx.message) {
    if (commandPlugin) {
      await updateCommandUsage(userId, commandPlugin);
    } else {
      await updateMessageStats(userId, user);
    }
  }
}

async function updateCommandUsage(userId: number, commandPlugin: ModuleParams): Promise<void> {
  const now = new Date();
  const currentMonthYear = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
  const commandName = commandPlugin.pattern || "-";

  const user = await sck1.findOne({ id: userId });
  if (!user) return;

  const updateQuery = user.frequentlyUsedCommands.some((cmd) => cmd.cmdName === commandName)
    ? {
        $inc: { "frequentlyUsedCommands.$[elem].cmdUsageCount": 1 },
        $set: { "frequentlyUsedCommands.$[elem].lastUsageMonth": currentMonthYear },
      }
    : {
        $push: {
          frequentlyUsedCommands: {
            cmdName: commandName,
            cmdUsageCount: 1,
            lastUsageMonth: currentMonthYear,
          },
        },
      };

  await sck1.updateOne(
    { id: userId },
    updateQuery,
    commandName ? { arrayFilters: [{ "elem.cmdName": commandName }] } : undefined
  );
}

async function updateMessageStats(userId: number, user: any): Promise<void> {
  await sck1.updateOne(
    { id: userId },
    {
      $set: {
        msg: user.msg + 1,
        lastSendMsg: new Date(),
        allTimeMessages: user.msg + 1,
      },
    }
  );
}

export async function start(bot: Bot, ctx: Context, isAction: boolean, { text, args, Logger }: any): Promise<void> {
  if (!ctx?.from?.id) return;

  try {
    const userId = ctx.from.id;
    const user = await sck1.findOne({ id: userId });
    const replyParameters = isAction || !ctx.msg ? undefined : { message_id: ctx.msg.message_id };

    if (!user) {
      await sendWelcomeMessage(ctx, userId, replyParameters, Logger);
    } else {
      await sendWelcomeBackMessage(ctx, user, replyParameters, Logger);
    }
  } catch (error) {
    Logger.error(`Start command error: ${error}`);
  }
}

async function sendWelcomeMessage(ctx: Context, userId: number, replyParameters: any, Logger: any): Promise<void> {
  const markup = {
    inline_keyboard: [
      [
        {
          text: "🤔 Ввод",
          callback_data: `set_orientation:${userId}`,
        },
      ],
    ],
  };

  try {
    await ctx.reply(
      `<b>🥳 Привет, ${ctx.from?.first_name}</b>! <i>Для работы с ботом придумайте слово, которое описывает вас (ориентацию)</i>!`,
      {
        parse_mode: "HTML",
        reply_parameters: replyParameters,
        reply_markup: markup,
      }
    );
  } catch (error) {
    Logger.warn(`Welcome message error: ${error}`);
  }
}

async function sendWelcomeBackMessage(ctx: Context, user: any, replyParameters: any, Logger: any): Promise<void> {
  const markup = {
    inline_keyboard: [
      [
        { text: "🏫 Помощь", callback_data: `help_data:${user.id}` },
        { text: "👤 Поддержка", url: "https://t.me/initnowgo_helper" },
      ],
    ],
  };

  try {
    await ctx.reply(`<b>👋 С возвращением, ${ctx.from?.first_name}!</b>\n\n<i>👇Помощь/Поддержка👇</i>`, {
      parse_mode: "HTML",
      reply_parameters: replyParameters,
      reply_markup: markup,
    });
  } catch (error) {
    Logger.warn(`Welcome back error: ${error}`);
  }
}

export interface ExecuteParams {
  text?: string;
  args?: string[];
  Logger?: any;
  sck1?: any;
  callbackData?: string;
}
