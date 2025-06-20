import { Context } from "grammy";
import { start } from "../../../lib";
import BotUpdate from "../../BotUpdates";

export class StartCommand extends BotUpdate {
  constructor() {
    super({
      pattern: "start",
      aliases: ["s"],
      desc: "Команда start",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(
    bot: any,
    ctx: Context,
    { text, args, Logger }: any
  ): Promise<void> {
    await start(bot, ctx, false, { text, args, Logger });
  }
}
