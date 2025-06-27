import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, default: "-" },
  username: { type: String, default: "-" },
  orientation: { type: String, default: "-" },
  level: { type: Number, default: 1 },
  msg: { type: Number, default: 50 },
  dirtyMsg: {
    total: { type: Number, default: 0 },
  },
  donate: {
    rsc: { type: Number, default: 0 },
    allSumDonate: { type: Number, default: 0 },
    subscriptions: [
      {
        type: { type: String, required: true, index: true }, // Тип подписки (например, VIP, PremiumVIP, bot_on_account and othr..)
        endDate: { type: Date, index: true }, // Дата окончания подписки
        additionalData: { type: mongoose.Schema.Types.Mixed }, // Дополнительные данные, если нужны
      },
    ],
  },
  bank: {
    card: { type: Boolean, default: false },
    sumMsg: { type: Number, default: 0 },
    cell: { type: Number, default: 1 },
  },
  passing: {},
  dataBan: {
    ban: { type: Boolean, default: false },
    typeBan: { type: String, default: "-" },
    dateBan: { type: String, default: "-" },
    dateUnban: { type: String, default: "-" },
    reasonBan: { type: String, default: "-" },
    countBan: { type: Number, default: 0 },
  },
  frequentlyUsedCommands: [
    {
      cmdName: { type: String, default: "-" },
      cmdUsageCount: { type: Number, default: 0 },
      lastUsageMonth: { type: String, default: "-" },
    },
  ],
  lastSendMsg: { type: Date, default: new Date() },
  allTimeMessages: { type: Number, default: 0 },
  dateRegisterAccount: { type: Date, default: new Date() },
});

const sck1 = mongoose.model("user", UserSchema);
export { sck1 };
