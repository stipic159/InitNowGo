import { Bot, BotUpdate, Context, ExecuteParams } from "../../../lib";

export class OnverGroupCommand extends BotUpdate {
  constructor() {
    super({
      pattern: "ovnergroup",
      aliases: ["og"],
      desc: "Группы создателя",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger }: ExecuteParams): Promise<void> {
    if (!ctx.msg) return;
    await ctx.reply("👇<b>Чат с ботом</b> <b>Канал бота</b>👇", {
      reply_parameters: { message_id: ctx.msg?.message_id },
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Чат с ботом", url: "https://t.me/initnowgo_chat" },
            { text: "Канал бота", url: "https://t.me/initnowgo" },
          ],
        ],
      },
    });
  }
}
