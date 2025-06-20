import fs from "fs/promises";
import { Context } from "grammy";
import path from "path";
import { config } from "../config/env.config";
import { reply } from "../config/reply.config";
import { Logger } from "../utils/Logger.utils";
import sck1 from "../utils/database/user.db";
import { isGroup, updateUserData } from "../utils/fucn.utils";
import { eco, EconomyOperations } from "./Eco";

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
  reply: any;
  eco: EconomyOperations;
  on?: boolean;
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
    this.level = params.level || 1; //
    this.priceMsg = params.priceMsg || 0; //
    this.priceLvl = params.priceLvl || 0; //
    this.isGroupOnly = params.isGroupOnly || false; // ✔️
    this.isPrivateOnly = params.isPrivateOnly || false; //
    this.isTagRequired = params.isTagRequired || false; //
    this.nsfw = params.nsfw || false; //
    this.cooldownTime = params.cooldownTime || 0; //
    this.reply = reply; // ✔️
    this.eco = eco; // ✔️
    this.on = params.on; // ✔️
  }

  private static async validateModuleAccess(
    ctx: Context,
    moduleParams: ModuleParams
  ): Promise<boolean> {
    if (!(ctx.from && ctx.chat)) return false;
    const userId = ctx.from?.id;
    const user = await sck1.findOne({ id: userId });

    if (!user) {
      if (
        ctx?.message?.text === "/start" ||
        ctx?.message?.text === "/s" ||
        ctx?.update?.callback_query?.data == `set_orientation:${userId}`
      ) {
        return true;
      }
      return false;
    }
    if (moduleParams.isCreator) {
      const developerId = Number(config.get("BOT").ID_DEVELOPER);

      if (userId !== developerId) {
        if (ctx.update.callback_query) {
          await ctx
            .answerCallbackQuery(
              reply.ru.BotUpdates.creatorAccessDeniedCallback
            )
            .catch(() => {});
        } else {
          if (!ctx.msg) return false;
          await ctx.reply(reply.ru.BotUpdates.creatorCommandRestricted, {
            reply_parameters: { message_id: ctx.msg.message_id },
          });
        }
        return false;
      }
    }

    if (moduleParams.isGroupOnly) {
      if (!isGroup(ctx)) {
        if (ctx.update.callback_query) {
          await ctx.answerCallbackQuery(`✖️ Ты не в группе!`).catch(() => {});
        } else {
          if (!ctx.msg) return false;
          await ctx.reply(`✖️ Ты не в группе!`, {
            reply_parameters: { message_id: ctx.msg.message_id },
          });
        }
        return false;
      }
    }

    if (moduleParams.isAdminGroup) {
      if (
        !["administrator", "creator"].includes(
          (await ctx.getChatMember(ctx.from.id)).status
        )
      ) {
        if (ctx.update.callback_query) {
          await ctx
            .answerCallbackQuery(`✖️ Ты не админ в группе!`)
            .catch(() => {});
        } else {
          if (!ctx.msg) return false;
          await ctx.reply(`✖️ Ты не админ в группе!`, {
            reply_parameters: { message_id: ctx.msg.message_id },
          });
        }
        return false;
      }
    }

    if (moduleParams.isCreatorGroup) {
      if (
        !["creator"].includes((await ctx.getChatMember(ctx.from.id)).status)
      ) {
        if (ctx.update.callback_query) {
          await ctx
            .answerCallbackQuery(`✖️ Ты не создатель группы!`)
            .catch(() => {});
        } else {
          if (!ctx.msg) return false;
          await ctx.reply(`✖️ Ты не создатель группы!`, {
            reply_parameters: { message_id: ctx.msg.message_id },
          });
        }
        return false;
      }
    }

    if (moduleParams.isPrivateOnly) {
      if (isGroup(ctx)) {
        if (ctx.update.callback_query) {
          await ctx.answerCallbackQuery(`✖️ Ты в группе!`).catch(() => {});
        } else {
          if (!ctx.msg) return false;
          await ctx.reply(`✖️ Ты в группе!`, {
            reply_parameters: { message_id: ctx.msg.message_id },
          });
        }
        return false;
      }
    }

    if (moduleParams.level) {
      if (user.level < moduleParams.level) {
        if (ctx.update.callback_query) {
          await ctx
            .answerCallbackQuery(
              `✖️ У вас недостаточно уровня! Чтобы его повысить, используйте /levelup`
            )
            .catch(() => {});
        } else {
          if (!ctx.msg) return false;
          await ctx.reply(
            `✖️ У вас недостаточно уровня! Чтобы его повысить, используйте /levelup`,
            {
              reply_parameters: { message_id: ctx.msg.message_id },
            }
          );
        }
        return false;
      }
    }

    if (moduleParams.priceMsg) {
      if (user.msg < moduleParams.priceMsg) {
        if (ctx.update.callback_query) {
          await ctx
            .answerCallbackQuery(`✖️ У вас недостаточно сообщений!`)
            .catch(() => {});
        } else {
          if (!ctx.msg) return false;
          await ctx.reply(`✖️ У вас недостаточно сообщений!`, {
            reply_parameters: { message_id: ctx.msg.message_id },
          });
        }
        return false;
      } else {
        await eco.takeMsg(ctx.from.id, moduleParams.priceMsg);
      }
    }

    if (moduleParams.priceLvl) {
      if (user.level < moduleParams.priceLvl) {
        if (ctx.update.callback_query) {
          await ctx
            .answerCallbackQuery(`✖️ У вас недостаточно уровня!`)
            .catch(() => {});
        } else {
          if (!ctx.msg) return false;
          await ctx.reply(`✖️ У вас недостаточно уровня!`, {
            reply_parameters: { message_id: ctx.msg.message_id },
          });
        }
        return false;
      }
    }

    return true;
  }

  static async register(bot: any) {
    const patternModules = Array.from(this.loadedModules.values()).filter(
      (m) => !m.on
    );

    const eventModules = Array.from(this.loadedModules.values()).filter(
      (m) => m.on === true
    );

    for (const moduleInfo of patternModules) {
      try {
        const { class: ModuleClass, pattern } = moduleInfo;
        const instance = new ModuleClass();
        bot.use(instance.execute.bind(instance));
        const patternString = pattern
          ? Array.isArray(pattern)
            ? pattern.join(", ")
            : pattern.toString()
          : "";
        Logger.info(
          reply.ru.moduleLogs.commandModule(ModuleClass.name, patternString)
        );
      } catch (error: any) {
        Logger.error(reply.ru.BotUpdates.moduleRegistrationError, error);
      }
    }

    for (const moduleInfo of eventModules) {
      try {
        const instance = new moduleInfo.class();
        bot.use(instance.execute.bind(instance));
        Logger.info(reply.ru.moduleLogs.globalHandler(moduleInfo.class.name));
      } catch (error) {
        Logger.error(reply.ru.BotUpdates.eventHandlerError, error);
      }
    }
  }

  static async loadModules(dir: string) {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);

        if (dir === __dirname && file.endsWith(".ts")) continue;

        if (stat.isDirectory()) {
          await this.loadModules(filePath);
        } else if (file.endsWith(".ts")) {
          try {
            const Module = await import(filePath);
            const ModuleClass = Object.values(Module).find(
              (exported) =>
                typeof exported === "function" &&
                /^class\s/.test(exported.toString())
            ) as { new (...args: any[]): BotUpdate } | undefined;

            if (ModuleClass) {
              const instance = new ModuleClass();
              const moduleData = {
                class: ModuleClass,
                ...instance,
              };

              if (file.endsWith(".event.ts")) {
                moduleData.on = true;
                moduleData.pattern = undefined;
                Logger.success(
                  reply.ru.moduleLogs.eventLoaded(ModuleClass.name, file)
                );
              } else {
                Logger.success(
                  reply.ru.moduleLogs.commandLoaded(ModuleClass.name, file)
                );
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
    const cleanCommand = command.startsWith("/")
      ? command.slice(1).split("@")[0]
      : command;

    const commandModule = this.getAll().find((cmd) => {
      if (cmd.pattern) {
        if (Array.isArray(cmd.pattern)) {
          if (cmd.pattern.some((p) => p.toLowerCase() === cleanCommand))
            return true;
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

  static async run(bot: any, ctx: Context) {
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
          await ctx
            .answerCallbackQuery(reply.ru.BotUpdates.callbackQueryError)
            .catch(() => {});
        }
        return;
      }

      if (ctx.message && "text" in ctx.message && ctx.message.text) {
        const fullText = ctx.message.text.trim();
        const commandRegex = new RegExp(
          `^/?([a-zA-Z0-9_]+)(?:@${botUsername})?\\s*([\\s\\S]*)$`,
          "i"
        );
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
        const hasAccess = await this.validateModuleAccess(ctx, commandModule);
        if (!hasAccess) return;
        const groupInfo = isGroup(ctx)
          ? `GId: ${ctx.chat?.id}, GN: ${ctx.chat?.title}`
          : "";

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
            const groupInfo = isGroup(ctx)
              ? `GId: ${ctx.chat?.id}, GN: ${ctx.chat?.title}`
              : "";

            Logger.message("======================");
            Logger.message(userInfo);
            if (groupInfo) Logger.message(groupInfo);
            Logger.message(
              `Content Type: ${contentType}, Text: ${textContent}`
            );
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
              Logger.error(
                `Error in module ${moduleInfo.class.name}:`,
                moduleError
              );
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

  static async handleCallbackQuery(bot: any, ctx: Context) {
    try {
      const callbackQuery = ctx.update.callback_query;
      if (!callbackQuery?.data) return;

      const data = callbackQuery.data;
      const [command] = data.split(":");

      const { commandModule } = this.find(command);
      if (commandModule) {
        const hasAccess = await this.validateModuleAccess(ctx, commandModule);
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
      await ctx
        .answerCallbackQuery(reply.ru.BotUpdates.callbackExecutionError)
        .catch(() => {});
    }
  }

  async execute(bot: any, ctx: Context, params: any) {
    throw new Error(reply.ru.BotUpdates.executeNotImplemented);
  }
}
