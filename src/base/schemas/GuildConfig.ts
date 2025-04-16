import { model, Schema } from "mongoose";

interface IGuildConfig {
  guildId: string;
}

export default model<IGuildConfig>(
  "GuildConfig",
  new Schema<IGuildConfig>(
    {
      guildId: String,
    },
    {
      timestamps: true,
    }
  )
);
