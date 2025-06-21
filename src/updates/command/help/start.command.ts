import { Bot, BotUpdate, Context, ExecuteParams, start } from "../../../lib";
export class StartCommand extends BotUpdate {
  constructor() {
    super({
      pattern: "start",
      aliases: ["s"],
      desc: "Команда start",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger }: ExecuteParams): Promise<void> {
    await start(bot, ctx, false, { text, args, Logger });
  }
}
