import { Bot, BotUpdate, SessionContext } from "../../../lib";
export class OrientationAction extends BotUpdate {
  constructor() {
    super({
      pattern: "set_orientation",
      desc: "установить ориентацию",
      category: ["🏠 Базовые команды"],
      isPrivateOnly: true,
    });
  }

  async execute(bot: Bot, ctx: SessionContext): Promise<void> {
    if (!ctx?.from?.id) return;
    await ctx.deleteMessage();
    const message = await ctx.reply("Введите слово, которое описывает вас (ориентацию)!");
    ctx.session.waitingForOrientation = true;
    ctx.session.pendingOrientation = {
      userId: ctx.from.id,
      callbackMessageId: message.message_id,
    };
  }
}
