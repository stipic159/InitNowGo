import { Context } from "grammy";
import { start } from "../../../utils/fucn.utils";
import BotUpdate from "../../BotUpdates";

export class StartAction extends BotUpdate {
  constructor() {
    super({
      pattern: "start_data",
      desc: "Дата start",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(
    bot: any,
    ctx: Context,
    { text, args, Logger }: any
  ): Promise<void> {
    await ctx.deleteMessage();
    await start(bot, ctx, true, { text, args, Logger });
  }
}
