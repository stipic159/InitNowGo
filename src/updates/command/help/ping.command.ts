import { Bot, BotUpdate, Context, ExecuteParams } from "../../../lib";

export class PingCommand extends BotUpdate {
  constructor() {
    super({
      pattern: "ping",
      aliases: ["pong"],
      desc: "Проверить скорость ответа",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger }: ExecuteParams): Promise<void> {
    if (!ctx.msg) return;
    if (!ctx.from) return;
    let initial = new Date().getTime();
    const message = await ctx.reply("🏓 Пинг...", { reply_parameters: { message_id: ctx.msg.message_id } });
    let final = new Date().getTime();
    const ping = final - initial;
    await bot.api.deleteMessage(ctx.from?.id, message.message_id).catch(() => {});
    await ctx.reply(`🏓 Понг:\n${ping} ms`, { reply_parameters: { message_id: ctx.msg.message_id } });
  }
}
