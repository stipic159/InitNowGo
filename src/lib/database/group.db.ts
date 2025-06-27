import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  events: { type: Boolean, default: false },
  nsfw: { type: Boolean, default: true },
  welcome: { type: String, default: "Привет @user, добро пожаловать в @gname" },
  goodbye: { type: String, default: "@user покинул группу" },
  removeAdminSwitch: { type: Boolean, default: false },
  banWords: { type: [String] }, // TODO: доделать банворды
  participants: [
    {
      id: { type: Number },
      username: { type: String },
    },
  ],
});

const sck = mongoose.model("group", GroupSchema);
export { sck };
