import { Bot, BotUpdate, Context, ExecuteParams, help } from "../../../lib";

export class HelpAction extends BotUpdate {
  constructor() {
    super({
      pattern: "help_data",
      desc: "Дата help",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger }: ExecuteParams): Promise<void> {
    await ctx.deleteMessage();
    await help(bot, ctx, true, { text, args, Logger });
  }
}
