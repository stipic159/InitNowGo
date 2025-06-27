import { Bot, BotUpdate, ExecuteParams, SessionContext } from "../../../lib";

export class OrientationEvent extends BotUpdate {
  constructor() {
    super({
      on: true,
      desc: "дебаг евент",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(bot: Bot, ctx: SessionContext, { Logger, sck1 }: ExecuteParams): Promise<void> {
    Logger.debug(JSON.stringify(ctx, null, 2));
  }
}
