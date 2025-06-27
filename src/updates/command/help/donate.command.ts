import { Bot, BotUpdate, Context, ExecuteParams } from "../../../lib";

export class DonateCommand extends BotUpdate {
  constructor() {
    super({
      pattern: "donate",
      desc: "Донат",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger }: ExecuteParams): Promise<void> {
    if (!ctx.msg) return;
    ctx.reply("Скоро...", { reply_parameters: { message_id: ctx.msg?.message_id } });
  }
}
