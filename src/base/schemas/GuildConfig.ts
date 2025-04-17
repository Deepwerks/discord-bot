import { model, Schema } from "mongoose";

interface IGuildConfig {
  guildId: string;
  lang: string;
}

export default model<IGuildConfig>(
  "GuildConfig",
  new Schema<IGuildConfig>(
    {
      guildId: { type: String, required: true, unique: true },
      lang: { type: String, default: "en" },
    },
    {
      timestamps: true,
    }
  )
);
