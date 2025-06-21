import { Bot, BotUpdate, Context, ExecuteParams, help } from "../../../lib";

export class HelpCommand extends BotUpdate {
  constructor() {
    super({
      pattern: "help",
      aliases: ["h", "menu"],
      desc: "Команда start",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger }: ExecuteParams): Promise<void> {
    await help(bot, ctx, { text, args, Logger });
  }
}
