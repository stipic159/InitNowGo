import { Context } from "grammy";
import { ModuleParams } from "../updates/BotUpdates";
import { sck1 } from "./database";
// import { eco, EconomyOperations } from "../updates/Eco";

export function isGroup(ctx?: Context): boolean {
  return ctx?.chat?.type === "supergroup" || ctx?.chat?.type === "group";
}

export async function updateUserData(
  ctx: Context,
  commandPlugin?: ModuleParams
) {
  const userId = ctx.from?.id;
  const username = ctx.from?.username;
  const name = ctx.from?.first_name;

  if (!userId) return;

  const user = await sck1.findOne({ id: userId });

  if (!user) {
    return;
  }

  if (ctx.message && commandPlugin) {
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}.${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    const commandName = commandPlugin.pattern || "-";

    const commandIndex = user.frequentlyUsedCommands.findIndex(
      (cmd) => cmd.cmdName === commandName
    );

    if (commandIndex >= 0) {
      await sck1.updateOne(
        { id: userId, "frequentlyUsedCommands.cmdName": commandName },
        {
          $inc: { "frequentlyUsedCommands.$.cmdUsageCount": 1 },
          $set: { "frequentlyUsedCommands.$.lastUsageMonth": currentMonthYear },
        }
      );
    } else {
      await sck1.updateOne(
        { id: userId },
        {
          $push: {
            frequentlyUsedCommands: {
              cmdName: commandName,
              cmdUsageCount: 1,
              lastUsageMonth: currentMonthYear,
            },
          },
        }
      );
    }
  } else if (ctx.message) {
    await sck1.updateOne(
      { id: userId },
      {
        msg: user.msg + 1,
        lastSendMsg: new Date(),
        allTimeMessages: user.msg + 1,
      }
    );
  }
}

export async function start(
  bot: any,
  ctx: Context,
  isAction: boolean,
  { text, args, Logger }: any
): Promise<void> {
  if (!ctx?.from?.id || !ctx.msg) return;
  const user = await sck1.findOne({ id: ctx.from?.id });
  const replyParameters = { message_id: ctx.msg.message_id };
  if (!user) {
    ctx.reply(
      `<b>🥳 Привет, ${ctx?.from?.first_name}</b>! <i>Для работы с ботом придумайте слово, которое описывает вас (ориентацию)</i>!`,
      {
        reply_parameters: !isAction ? replyParameters : undefined,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🤔 Ввод",
                callback_data: `set_orientation:${ctx?.from?.id}`,
              },
            ],
          ],
        },
      }
    );
    return;
  }
  ctx.reply(
    `<b>👋 С возвращением, ${ctx?.from?.first_name}!</b>\n\n<i>👇Помощь/Поддержка👇</i>`,
    {
      reply_parameters: !isAction ? replyParameters : undefined,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🏫 Помощь",
              callback_data: `help_data:${ctx?.from?.id}`,
            },
            {
              text: "👤 Поддержка",
              url: "https://t.me/initnowgo_helper",
            },
          ],
        ],
      },
    }
  );
  return;
}

export async function help(
  bot: any,
  ctx: Context,
  { text, args, Logger }: any
): Promise<void> {
  await ctx.reply("");
}
