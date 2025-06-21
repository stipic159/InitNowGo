import { Bot, BotUpdate, Context, ExecuteParams, start } from "../../../lib";
export class StartAction extends BotUpdate {
  constructor() {
    super({
      pattern: "start_data",
      desc: "Дата start",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger }: ExecuteParams): Promise<void> {
    await ctx.deleteMessage();
    await start(bot, ctx, true, { text, args, Logger });
  }
}
