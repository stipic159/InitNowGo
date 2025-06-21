import { Bot, BotUpdate, Context, ExecuteParams } from "../../../lib";

export class HelpCommand extends BotUpdate {
  constructor() {
    super({
      pattern: "help",
      aliases: ["h", "menu"],
      desc: "Помощь по командам",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger }: ExecuteParams): Promise<void> {
    if (!ctx.msg) return;
    const name = ctx.from?.first_name || ctx.from?.username || "Пользователь";
    const categories = Array.from(BotUpdate.categoryIdMap.keys());

    const buttons = categories.map((category) => [
      {
        text: category,
        callback_data: `help_category:${BotUpdate.categoryIdMap.get(category)}:${ctx.msg?.message_id}:${ctx.from?.id}`,
      },
    ]);

    await ctx.reply(`Привет, ${name}! Выбери категорию, чтобы посмотреть все команды:`, {
      reply_markup: { inline_keyboard: buttons },
      reply_parameters: { message_id: ctx.msg?.message_id },
    });
  }
}
