import { Bot, BotUpdate, Context, ExecuteParams, isGroup } from "../../../lib";

export class HelpCategoryAction extends BotUpdate {
  constructor() {
    super({
      pattern: "help_category",
      desc: "обработчик хелпа",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger, sck1 }: ExecuteParams): Promise<void> {
    const [_, categoryId, messageId, userId] = args || [];

    const entries = Array.from<[string, string]>((BotUpdate as any).categoryIdMap.entries());
    const category = BotUpdate.categoryNameMap.get(Number(categoryId));

    if (!category) {
      await ctx.answerCallbackQuery({
        text: "⚠️ Категория не найдена",
        show_alert: true,
      });
      return;
    }

    let commands = BotUpdate.getByType("command").filter((cmd) => cmd.category.includes(category));

    const visibleCommands = [];
    for (const cmd of commands) {
      if (await this.isCommandVisible(bot, ctx, cmd, sck1)) {
        visibleCommands.push(cmd);
      }
    }
    commands = visibleCommands;

    if (commands.length === 0) {
      await ctx.answerCallbackQuery({
        text: "🚫 В этой категории нет доступных команд",
        show_alert: true,
      });
      return;
    }

    let message = `📂 <b>${category}</b>\n\n`;
    commands.forEach((cmd) => {
      const patterns = Array.isArray(cmd.pattern) ? cmd.pattern : [cmd.pattern || ""];

      const paramsInfo = [];
      if (cmd.level && cmd.level > 1) paramsInfo.push(`Ур. ${cmd.level}`);
      if (cmd.priceLvl && cmd.priceLvl > 0) paramsInfo.push(`Цена: ${cmd.priceLvl} ур.`);
      if (cmd.priceMsg && cmd.priceMsg > 0) paramsInfo.push(`Цена: ${cmd.priceMsg} сообщ.`);

      const paramsString = paramsInfo.length > 0 ? ` (${paramsInfo.join(", ")})` : "";

      message += `• /${patterns[0]} - ${cmd.desc} ${paramsString}\n`;
    });

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "⬅️ Назад", // todo
            callback_data: `help:${ctx.from?.id}`,
          },
        ],
      ],
    };

    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  }

  private async isCommandVisible(bot: Bot, ctx: Context, cmd: any, sck1: any): Promise<boolean> {
    try {
      if (!ctx.from) return false;

      if (cmd.isGroupOnly && !isGroup(ctx)) return false;

      if (cmd.isPrivateOnly && isGroup(ctx)) return false;

      if (isGroup(ctx) && (cmd.isAdminGroup || cmd.isCreatorGroup)) {
        const member = (await ctx.getChatMember(ctx.from.id)).status;
        if (cmd.isAdminGroup && !["administrator", "creator"].includes(member)) return false;

        if (cmd.isCreatorGroup && member !== "creator") return false;
      }

      const user = await sck1.findOne({ id: ctx.from.id });
      const userLevel = user?.level ?? 0;

      if (cmd.level && userLevel < cmd.level) return false;

      return true;
    } catch {
      return false;
    }
  }
}
