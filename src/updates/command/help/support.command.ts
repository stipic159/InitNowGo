import { Bot, BotUpdate, config, Context, ExecuteParams } from "../../../lib";

export class SupportCommand extends BotUpdate {
  constructor() {
    super({
      pattern: "support",
      aliases: ["sup"],
      desc: "Поддержка, помощь",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger }: ExecuteParams): Promise<void> {
    if (!ctx.msg) return;
    await ctx.reply("Ждем ваши вопросы/жалобы/идеи/предложеия\n\n👇<b>Поддержка</b>👇", {
      reply_parameters: { message_id: ctx.msg?.message_id },
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Чат с ботом", url: `${(await bot.api.getChat(config.get("BOT").SUPPORT_ID)).username}.t.me` }],
        ],
      },
    });
  }
}
