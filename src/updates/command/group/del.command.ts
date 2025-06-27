import { Bot, BotUpdate, Context, ExecuteParams } from "../../../lib";

export class DelCommand extends BotUpdate {
  constructor() {
    super({
      pattern: "del",
      desc: "Удалить сообщение",
      category: ["🌎 Группа"],
      isBotAdminGroup: true,
      isGroupOnly: true,
      isAdminGroup: true,
      isTagRequired: true,
    });
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger }: ExecuteParams): Promise<void> {}
}
