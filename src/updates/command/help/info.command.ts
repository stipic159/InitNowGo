import os from "os";
import { Bot, Context, ExecuteParams, config } from "../../../lib";
import BotUpdate from "../../BotUpdates";

export default class BotInfo extends BotUpdate {
  constructor() {
    super({
      pattern: "info",
      aliases: ["botinfo"],
      desc: "Информация о боте",
      category: ["🏠 Базовые команды"],
    });
  }
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = Math.floor(seconds % 60);

    return [days > 0 ? `${days}д` : "", hours > 0 ? `${hours}ч` : "", minutes > 0 ? `${minutes}м` : "", `${secs}с`]
      .filter(Boolean)
      .join(" ");
  }

  private formatBytes(bytes: number): { value: string; unit: string } {
    const sizes = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
    if (bytes === 0) return { value: "0", unit: "B" };
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = (bytes / Math.pow(1024, i)).toFixed(2);
    return { value, unit: sizes[i] };
  }

  private getCPUInfo(): string {
    const cpus = os.cpus();
    if (cpus.length === 0) return "Недоступно";

    const model = cpus[0].model.split(/\s+/g).slice(0, 3).join(" ");
    const cores = cpus.length;
    const speed = (cpus[0].speed / 1000).toFixed(1);

    return `${model} (${cores}×${speed} GHz)`;
  }

  async execute(bot: Bot, ctx: Context, { text, args, Logger }: ExecuteParams): Promise<void> {
    if (!ctx.msg) return;
    try {
      const botConfig = config.get("BOT");
      const version = botConfig.VERSION || "1.0.0";
      const developerId = botConfig.ID_DEVELOPER || "0";

      const totalMemory = this.formatBytes(os.totalmem());
      const freeMemory = this.formatBytes(os.freemem());
      const memoryUsage = this.formatBytes(process.memoryUsage().rss);
      const uptime = this.formatUptime(process.uptime());
      const platform = `${os.platform()} (${os.arch()})`;
      const cpuInfo = this.getCPUInfo();
      const nodeVersion = process.version;

      const commands = BotUpdate.getByType("command").length;
      const events = BotUpdate.getByType("event").length;
      const actions = BotUpdate.getByType("action").length;

      const content = `
<b>🤖 ИНФОРМАЦИЯ О БОТЕ</b>
╭─────────────────
├ <b>Версия:</b> <code>${version}</code>
├ <b>Разработчик:</b> <a href="tg://user?id=${developerId}">${(await bot.api.getChat(developerId)).first_name}</a>
├ <b>Загружено:</b>
│   ├ Команд: <b>${commands}</b>
│   ├ Событий: <b>${events}</b>
│   └ Действий: <b>${actions}</b>
╰─────────────────

<b>⚙ ХАРАКТЕРИСТИКИ СЕРВЕРА</b>
╭─────────────────
├ <b>ОС:</b> ${platform}
├ <b>Процессор:</b> ${cpuInfo}
├ <b>Память:</b>
│   ├ Всего: <b>${totalMemory.value}</b> ${totalMemory.unit}
│   ├ Свободно: <b>${freeMemory.value}</b> ${freeMemory.unit}
│   └ Бот использует: <b>${memoryUsage.value}</b> ${memoryUsage.unit}
├ <b>Время работы:</b> ${uptime}
├ <b>Node:</b> ${nodeVersion}
╰─────────────────
            `.trim();

      await ctx.reply(content, {
        parse_mode: "HTML",
        reply_parameters: {
          message_id: ctx.msg.message_id,
          allow_sending_without_reply: true,
        },
      });
    } catch (error) {
      Logger.error("Ошибка в команде /info:", error);
      await ctx.reply("❌ Произошла ошибка при получении информации", {
        reply_parameters: { message_id: ctx.msg.message_id },
      });
    }
  }
}
