import fs from "fs/promises";
import path from "path";
import { Bot, config, Context, ExecuteParams, isGroup, Logger, reply, sck1, updateUserData } from "../lib";
import { eco, EconomyOperations } from "./Eco";

const lastCommandUsageTimes = new Map();

const MESSAGE_TYPES: string[] = [
  "text",
  "photo",
  "video",
  "audio",
  "voice",
  "document",
  "sticker",
  "poll",
  "location",
  "contact",
  "dice",
  "game",
  "video_note",
  "invoice",
  "successful_payment",
  "animation",
  "passport_data",
];
const DATABASES = {
  sck1,
};
const UPDATE_TYPES: string[] = [
  "new_chat_members",
  "left_chat_member",
  "new_chat_title",
  "new_chat_photo",
  "delete_chat_photo",
  "group_chat_created",
  "supergroup_chat_created",
  "channel_chat_created",
  "migrate_to_chat_id",
  "migrate_from_chat_id",
  "pinned_message",
  "connected_website",
];

export interface ModuleParams {
  pattern?: string | RegExp | string[];
  aliases?: string[];
  on?: boolean;
  desc: string;
  category: string[];
  isCreator?: boolean;
  isAdminGroup?: boolean;
  isCreatorGroup?: boolean;
  level?: number;
  priceMsg?: number;
  priceLvl?: number;
  isGroupOnly?: boolean;
  isPrivateOnly?: boolean;
  isTagRequired?: boolean;
  nsfw?: boolean;
  moduleType?: string;
  cooldownTime?: number;
}

interface LoadedModule extends ModuleParams {
  class: new () => BotUpdate;
}

export default class BotUpdate {
  static loadedModules = new Map<string, LoadedModule>();
  pattern?: string | RegExp | string[];
  aliases?: string[];
  desc: string;
  category: string[];
  isCreator: boolean;
  isAdminGroup?: boolean;
  isCreatorGroup?: boolean;
  level?: number;
  priceMsg?: number;
  priceLvl?: number;
  isGroupOnly?: boolean;
  isPrivateOnly?: boolean;
  isTagRequired?: boolean;
  nsfw?: boolean;
  cooldownTime?: number;
  reply: any;
  eco: EconomyOperations;
  moduleType?: "action" | "event" | "command" | "none";
  on?: boolean;

  constructor(params: ModuleParams) {
    if (!params.on && !params.pattern) {
      throw new Error(reply.ru.BotUpdates.patternRequiredError);
    }

    this.pattern = params.pattern; // ✔️
    this.aliases = params.aliases; // ✔️
    this.desc = params.desc; // ✔️
    this.category = params.category; // ✔️
    this.isCreator = params.isCreator || false; // ✔️
    this.isAdminGroup = params.isAdminGroup || false; // ✔️
    this.isCreatorGroup = params.isCreatorGroup || false; // ✔️
    this.level = params.level || 1; // ✔️
    this.priceMsg = params.priceMsg || 0; // ✔️
    this.priceLvl = params.priceLvl || 0; // ✔️
    this.isGroupOnly = params.isGroupOnly || false; // ✔️
    this.isPrivateOnly = params.isPrivateOnly || false; // ✔️
    this.isTagRequired = params.isTagRequired || false; // todo
    this.nsfw = params.nsfw || false; // todo
    this.cooldownTime = params.cooldownTime || 0; // ✔️
    this.reply = reply; // ✔️
    this.eco = eco; // ✔️
    this.moduleType = "none";
    this.on = params.on; // ✔️
  }

  private static async validateModuleAccess(bot: Bot<Context>, ctx: Context, moduleParams: ModuleParams): Promise<boolean> {
    if (!ctx.from || !ctx.chat) return false;

    const userId = ctx.from.id;
    const isCallback = !!ctx.update.callback_query;
    const user = await sck1.findOne({ id: userId });

    const replyError = async (text: string, showAlert = false) => {
      if (isCallback) {
        await ctx.answerCallbackQuery({ text, show_alert: showAlert }).catch(() => {});
      } else if (ctx.msg) {
        await ctx.reply(text, {
          reply_parameters: { message_id: ctx.msg.message_id },
        });
      }
    };

    if (!user) {
      const isAllowed =
        ctx.message?.text === "/start" ||
        ctx.message?.text === "/s" ||
        ctx.update.callback_query?.data === `set_orientation:${userId}`;
      return isAllowed;
    }

    if (moduleParams.isCreator) {
      const developerId = Number(config.get("BOT").ID_DEVELOPER);
      if (userId !== developerId) {
        const message = isCallback
          ? reply.ru.BotUpdates.creatorAccessDeniedCallback
          : reply.ru.BotUpdates.creatorCommandRestricted;

        await replyError(message, isCallback);
        return false;
      }
    }

    if (moduleParams.cooldownTime) {
      const currentTime = Date.now();
      const lastTime = lastCommandUsageTimes.get(ctx.chat.id) || 0;
      const elapsed = currentTime - lastTime;

      if (elapsed < moduleParams.cooldownTime) {
        const remaining = moduleParams.cooldownTime - elapsed;
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        const timeParts = [];
        if (hours) timeParts.push(`${hours} часов`);
        if (minutes) timeParts.push(`${minutes} минут`);
        if (seconds) timeParts.push(`${seconds} секунд`);
        const remainingTime = timeParts.join(" ") || "0 секунд";

        const errorMsg = `❗ Ошибка\n\n> Данная команда доступна раз в ${moduleParams.cooldownTime} мс, повторите попытку через - ${remainingTime}`;

        if (isCallback) {
          await ctx.answerCallbackQuery({ text: errorMsg, show_alert: true }).catch(() => {});
        } else if (ctx.msg) {
          const { message_id } = await ctx.reply(
            `<b>❗ Ошибка</b>\n\n> Данная команда доступна раз в ${moduleParams.cooldownTime} мс, повторите попытку через - <b>${remainingTime}</b>`,
            {
              parse_mode: "HTML",
              reply_parameters: { message_id: ctx.msg.message_id },
            }
          );
          await new Promise((resolve) => setTimeout(resolve, 4000));
          await bot.api.deleteMessage(ctx.chat.id, message_id).catch(() => {});
        }
        return false;
      }
      lastCommandUsageTimes.set(ctx.chat.id, currentTime);
    }

    const checkGroupCondition = async (condition: boolean, errorText: string): Promise<boolean> => {
      if (!condition) {
        await replyError(errorText);
        return false;
      }
      return true;
    };

    if (
      (moduleParams.isGroupOnly && !(await checkGroupCondition(isGroup(ctx), "✖️ Ты не в группе!"))) ||
      (moduleParams.isPrivateOnly && !(await checkGroupCondition(!isGroup(ctx), "✖️ Ты в группе!")))
    ) {
      return false;
    }

    const checkRole = async (requiredStatus: string[], errorText: string) => {
      if (!ctx.chat) return false;
      const status = (await ctx.getChatMember(userId)).status;
      if (!requiredStatus.includes(status)) {
        await replyError(errorText);
        return false;
      }
      return true;
    };

    if (
      (moduleParams.isAdminGroup && !(await checkRole(["administrator", "creator"], "✖️ Ты не админ в группе!"))) ||
      (moduleParams.isCreatorGroup && !(await checkRole(["creator"], "✖️ Ты не создатель группы!")))
    ) {
      return false;
    }

    const checkResource = async (hasEnough: boolean, errorText: string): Promise<boolean> => {
      if (!hasEnough) {
        await replyError(errorText);
        return false;
      }
      return true;
    };

    if (
      (moduleParams.level &&
        !(await checkResource(
          user.level >= moduleParams.level,
          "✖️ У вас недостаточно уровня! Чтобы его повысить, используйте /levelup"
        ))) ||
      (moduleParams.priceMsg &&
        !(await checkResource(
          user.msg >= moduleParams.priceMsg,
          "✖️ Вам не хватает сообщений для совершения покупки! Купить: /donate"
        ))) ||
      (moduleParams.priceLvl &&
        !(await checkResource(
          user.level >= moduleParams.priceLvl,
          "✖️ Вам не хватает уровня для совершения покупки! Купить уровень: /levelup"
        )))
    ) {
      return false;
    }

    if (moduleParams.priceMsg) await eco.takeMsg(userId, moduleParams.priceMsg);
    if (moduleParams.priceLvl) await eco.takeLvl(userId, moduleParams.priceLvl);

    return true;
  }

  static getByType(type: "command" | "action" | "event"): LoadedModule[] {
    return Array.from(this.loadedModules.values()).filter((m) => m.moduleType === type);
  }

  static async register(bot: Bot) {
    const patternModules = Array.from(this.loadedModules.values()).filter((m) => !m.on);

    const eventModules = Array.from(this.loadedModules.values()).filter((m) => m.on === true);

    for (const moduleInfo of patternModules) {
      try {
        const { class: ModuleClass, pattern } = moduleInfo;
        const instance = new ModuleClass();
        bot.use(instance.execute.bind(instance) as any);
      } catch (error: any) {
        Logger.error(reply.ru.BotUpdates.moduleRegistrationError, error);
      }
    }

    for (const moduleInfo of eventModules) {
      try {
        const instance = new moduleInfo.class();
        bot.use(instance.execute.bind(instance) as any);
      } catch (error) {
        Logger.error(reply.ru.BotUpdates.eventHandlerError, error);
      }
    }
  }

  static async loadModules(dir: string) {
    const tsNode = path.join(`${__dirname}/..`).endsWith("src") ? ".ts" : ".js";
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);

        if (dir === __dirname && file.endsWith(tsNode)) continue;

        if (stat.isDirectory()) {
          await this.loadModules(filePath);
        } else if (file.endsWith(tsNode)) {
          try {
            const Module = await import(filePath);
            const ModuleClass = Object.values(Module).find(
              (exported) => typeof exported === "function" && /^class\s/.test(exported.toString())
            ) as { new (...args: any[]): BotUpdate } | undefined;

            if (ModuleClass) {
              const instance = new ModuleClass();
              const moduleData = {
                class: ModuleClass,
                ...instance,
              };

              if (file.endsWith(`.event${tsNode}`)) {
                moduleData.on = true;
                moduleData.pattern = undefined;
                moduleData.moduleType = "event";
                Logger.success(`[EVENT] Загружено: ${ModuleClass.name} из ${file}`);
              } else if (file.endsWith(`.action${tsNode}`)) {
                moduleData.moduleType = "action";
                Logger.success(`[ACTION] Загружено: ${ModuleClass.name} из ${file}`);
              } else if (file.endsWith(`.command${tsNode}`)) {
                moduleData.moduleType = "command";
                Logger.success(`[COMMAND] Загружено: ${ModuleClass.name} из ${file}`);
              }

              this.loadedModules.set(file, moduleData);
            } else {
              Logger.warn(reply.ru.BotUpdates.missingClassWarning);
            }
          } catch (error: any) {
            Logger.error(reply.ru.BotUpdates.moduleLoadError, error);
          }
        }
      }
    } catch (error) {
      Logger.error(reply.ru.BotUpdates.directoryReadError, error);
    }
  }

  static find(body: string) {
    const [command] = body.trim().toLowerCase().split(/\s+/);
    const cleanCommand = command.startsWith("/") ? command.slice(1).split("@")[0] : command;

    const commandModule = this.getAll().find((cmd) => {
      if (cmd.pattern) {
        if (Array.isArray(cmd.pattern)) {
          if (cmd.pattern.some((p) => p.toLowerCase() === cleanCommand)) return true;
        } else if (cmd.pattern instanceof RegExp) {
          if (cmd.pattern.test(cleanCommand)) return true;
        } else if (cmd.pattern.toLowerCase() === cleanCommand) {
          return true;
        }
      }

      if (cmd.aliases && cmd.aliases.length > 0) {
        const normalizedAliases = cmd.aliases.map((a) => a.toLowerCase());
        if (normalizedAliases.includes(cleanCommand)) {
          return true;
        }
      }

      return false;
    });

    return { commandModule, events: [] };
  }

  static getAll(): LoadedModule[] {
    return Array.from(BotUpdate.loadedModules.values());
  }

  static async run(bot: Bot, ctx: Context) {
    let text: string = "";
    let args: string[] = [];
    let command: string = "";
    const botUsername = ctx.me.username.toLowerCase();

    try {
      if (ctx.update.callback_query) {
        const callbackData = ctx.update.callback_query.data;
        if (callbackData) {
          await this.handleCallbackQuery(bot, ctx);
        } else {
          Logger.warn(reply.ru.BotUpdates.invalidCallbackWarning);
          await ctx.answerCallbackQuery(reply.ru.BotUpdates.callbackQueryError).catch(() => {});
        }
        return;
      }

      if (ctx.message && "text" in ctx.message && ctx.message.text) {
        const fullText = ctx.message.text.trim();
        const commandRegex = new RegExp(`^/?([a-zA-Z0-9_]+)(?:@${botUsername})?\\s*([\\s\\S]*)$`, "i");
        const match = fullText.match(commandRegex);

        if (match) {
          const [, rawCommand, paramsText] = match;
          command = rawCommand.toLowerCase();
          text = paramsText.trim();
          args = [command, ...text.split(/\s+/).filter(Boolean)];
        }
      }

      const { commandModule } = BotUpdate.find(command);
      if (commandModule) {
        const hasAccess = await this.validateModuleAccess(bot, ctx, commandModule);
        if (!hasAccess) return;
        const groupInfo = isGroup(ctx) ? `GId: ${ctx.chat?.id}, GN: ${ctx.chat?.title}` : "";

        Logger.command("======================");
        Logger.command(`ID: ${ctx.from?.id}, UN: ${ctx.from?.username}`);
        if (groupInfo) Logger.command(groupInfo);
        Logger.command(`CMD: ${command}, Text: ${text}`);
        Logger.command("======================");

        await updateUserData(ctx, commandModule);

        const instance = new commandModule.class();
        await instance.execute(bot, ctx, {
          text,
          args,
          Logger,
          ...DATABASES,
        });
      } else {
        try {
          let contentType = "unknown";
          let textContent = "";

          if (ctx.message) {
            for (const type of MESSAGE_TYPES) {
              if (ctx.message[type as keyof typeof ctx.message] !== undefined) {
                contentType = type;
                break;
              }
            }

            if ("text" in ctx.message) {
              textContent = ctx.message.text || "";
            } else if ("caption" in ctx.message) {
              textContent = ctx.message.caption || "";
            }
          }
          try {
            const userInfo = `ID: ${ctx.from?.id}, UN: ${ctx.from?.username}`;
            const groupInfo = isGroup(ctx) ? `GId: ${ctx.chat?.id}, GN: ${ctx.chat?.title}` : "";

            Logger.message("======================");
            Logger.message(userInfo);
            if (groupInfo) Logger.message(groupInfo);
            Logger.message(`Content Type: ${contentType}, Text: ${textContent}`);
            Logger.message("======================");
          } catch (loggingError) {
            Logger.error("Logging failed:", loggingError);
          }
          const eventModules = this.getAll().filter((m) => m.on);
          for (const moduleInfo of eventModules) {
            try {
              const instance = new moduleInfo.class();
              await instance.execute(bot, ctx, {
                text: command,
                args: [command],
                Logger,
                ...DATABASES,
              });
            } catch (moduleError) {
              Logger.error(`Error in module ${moduleInfo.class.name}:`, moduleError);
            }
          }
        } catch (filterError) {
          Logger.error("Error filtering modules:", filterError);
        }
      }
    } catch (error: any) {
      Logger.error(reply.ru.BotUpdates.botRunError, error);
    }
  }

  static async handleCallbackQuery(bot: Bot, ctx: Context) {
    try {
      const callbackQuery = ctx.update.callback_query;
      if (!callbackQuery?.data) return;

      const data = callbackQuery.data;
      const [command] = data.split(":");

      const { commandModule } = this.find(command);
      if (commandModule) {
        const hasAccess = await this.validateModuleAccess(bot, ctx, commandModule);
        if (!hasAccess) return;

        const instance = new commandModule.class();
        await instance.execute(bot, ctx, {
          text: data.split(":").slice(1).join(":"),
          args: [command, ...data.split(":").slice(1)],
          Logger,
          callbackData: data,
          ...DATABASES,
        });
      }
    } catch (error) {
      Logger.error(reply.ru.BotUpdates.callbackProcessingError, error);
      await ctx.answerCallbackQuery(reply.ru.BotUpdates.callbackExecutionError).catch(() => {});
    }
  }

  async execute(bot: Bot, ctx: Context, params: ExecuteParams) {
    throw new Error(reply.ru.BotUpdates.executeNotImplemented);
  }
}
