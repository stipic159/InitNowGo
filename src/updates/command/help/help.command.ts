import { Context } from "grammy";
import { help } from "../../../lib";
import BotUpdate from "../../BotUpdates";

export class HelpCommand extends BotUpdate {
  constructor() {
    super({
      pattern: "help",
      aliases: ["h", "menu"],
      desc: "Команда start",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(
    bot: any,
    ctx: Context,
    { text, args, Logger }: any
  ): Promise<void> {
    await help(bot, ctx, { text, args, Logger });
  }
}
