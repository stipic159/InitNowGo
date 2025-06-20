import { Bot } from "grammy";
import { config } from "../../../config/env.config";
import { SessionContext } from "../../../main";
import BotUpdate from "../../BotUpdates";

// Функция для экранирования HTML-символов
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export class OrientationEvent extends BotUpdate {
  constructor() {
    super({
      on: true,
      desc: "обработчик ориентации",
      category: ["🏠 Базовые команды"],
    });
  }

  async execute(
    bot: Bot<SessionContext>,
    ctx: SessionContext,
    { Logger, sck1 }: any
  ): Promise<void> {
    if (!ctx.message || !("text" in ctx.message)) return;

    const session = ctx.session;
    if (!session?.waitingForOrientation || !session.pendingOrientation) return;

    const { userId, callbackMessageId } = session.pendingOrientation;
    if (userId !== ctx.from?.id) return;
    if (!ctx?.chat?.id) return;

    session.errorMessageIdsOrientation ??= [];

    const orientationText = ctx?.message?.text?.trim();
    const isValidText =
      orientationText &&
      orientationText.length <= 17 &&
      /^[\p{L}\p{M}\w\s\p{Emoji}\d]+$/u.test(orientationText);

    if (!isValidText) {
      const errorMsg = await ctx.reply(
        `<b>🛡️ Помощь</b>\n\nНе больше 17 символов, без ссылок, некоторые символы заблокированы.`,
        { parse_mode: "HTML" }
      );
      session.errorMessageIdsOrientation.push(
        errorMsg.message_id,
        ctx.message.message_id
      );
      return;
    }

    await this.cleanupMessages(bot, ctx, session, callbackMessageId);

    try {
      const user = await sck1.findOne({ id: userId });
      const escapedOrientation = escapeHtml(orientationText);

      // Обработка нового пользователя
      if (!user) {
        const loadingSteps = [
          "⏳ Загрузка, пожалуйста, подождите...",
          "📂 Создаем таблицу в базе данных...",
          "⚙️ Настраиваем ваш профиль...",
          "✅ Загрузка завершена!",
        ];

        const { message_id: loadingMsgId } = await ctx.reply(loadingSteps[0]);

        for (let i = 1; i < loadingSteps.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
          await bot.api.editMessageText(
            ctx.chat.id,
            loadingMsgId,
            loadingSteps[i]
          );
        }

        // Создание пользователя с бонусами
        const currentDate = new Date();
        const endDate = new Date();
        endDate.setDate(currentDate.getDate() + 14);
        const supportUsername = (
          await bot.api.getChat(config.get("BOT").SUPPORT_ID)
        ).username;

        await sck1.create({
          id: userId,
          name: ctx.from.first_name || "Unknown",
          orientation: orientationText,
          username: ctx.from.username ?? "-",
          msg: 25000,
          donate: {
            subscriptions: [
              {
                type: "VIP",
                endDate: endDate,
              },
            ],
          },
        });

        // HTML-форматированное приветствие
        const welcomeMessage =
          `<b>🌟 Привет, новобранец! 🌟</b>\n\n` +
          `Твоя ориентация → <i>${escapedOrientation}</i> успешно установлена. 🎉\n` +
          "И у нас для тебя <b>подарок</b> за регистрацию:\n" +
          "🎁 <b>VIP-статус на 14 дней</b>\n" +
          "💰 <b>25,000 мсг</b> уже на твоём аккаунте.\n" +
          "<i>Расходуй их с умом!</i> ✅\n\n" +
          "Подарки уже активированы, проверь их с помощью команды:\n" +
          "🎁 /rank\n\n" +
          `<b>Список команд бота:</b> /help\n` +
          `🙋‍♂️ <b>Поддержка:</b> <a href="https://t.me/${supportUsername}">@${supportUsername}</a>\n` +
          "⚖️ <b>Все права защищены:</b> ING (2025)";

        await bot.api.editMessageText(
          ctx.chat.id,
          loadingMsgId,
          welcomeMessage,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🏠 На главную",
                    callback_data: `start_data:${ctx.from.id}`,
                  },
                ],
              ],
            },
          }
        );

        Logger.success(`Новая запись создана с бонусами! ID: ${userId}`);
      } else {
        // Обновление существующего пользователя
        await sck1.updateOne(
          { id: userId },
          { $set: { orientation: orientationText } }
        );

        await ctx.reply(
          `Вы успешно изменили ориентацию на <i>${escapedOrientation}</i>!`,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🏠 На главную",
                    callback_data: `start_data:${ctx.from.id}`,
                  },
                ],
              ],
            },
          }
        );
      }
    } catch (e) {
      console.error(e);
      await ctx.reply("Произошла ошибка при обработке вашего запроса.");
    } finally {
      // Сброс состояния сессии
      session.waitingForOrientation = false;
      delete session.pendingOrientation;
      session.errorMessageIdsOrientation = [];
    }
  }

  private async cleanupMessages(
    bot: any,
    ctx: SessionContext,
    session: any,
    callbackMessageId?: number
  ) {
    const deletePromises: Promise<void>[] = [];

    session.errorMessageIdsOrientation.forEach((msgId: number) => {
      deletePromises.push(
        bot.api.deleteMessage(ctx.chat?.id, msgId).catch(() => {})
      );
    });

    if (callbackMessageId) {
      deletePromises.push(
        bot.api.deleteMessage(ctx.chat?.id, callbackMessageId).catch(() => {})
      );
    }

    await Promise.all(deletePromises);
    session.errorMessageIdsOrientation = [];
  }
}
