import { Bot, BotUpdate, Context, ExecuteParams } from "../../../lib";

const rulesBot =
  `📖 *Правила бота:*\n\n` +
  `*1.1* Продажа MSG за реальную валюту\n` +
  `> *Наказание*: ЧС Проекта\n\n` +
  `*1.2* Багоюз\n` +
  `> *Наказание*: Блокировка аккаунта на 180 дней + Обнуление аккаунта\n\n` +
  `*1.3* Нанесение вреда проекту.\n` +
  `> *Наказание:* ЧС проекта\n\n` +
  `*1.4* Распространение дезинформации о боте.\n` +
  `> *Наказание:* Блокировка аккаунта на 30 дней`;

export class RulesCommand extends BotUpdate {
  constructor() {
    super({
      pattern: "rules",
      desc: "Правила бота",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger }: ExecuteParams): Promise<void> {
    if (!ctx.msg) return;
    await ctx.reply(rulesBot, { parse_mode: "Markdown", reply_parameters: { message_id: ctx.msg.message_id } });
  }
}
