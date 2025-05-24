import { model, Schema } from 'mongoose';

interface IGuildConfigSchema {
  guildId: string;
  lang: string;
}

export default model<IGuildConfigSchema>(
  'GuildConfig',
  new Schema<IGuildConfigSchema>(
    {
      guildId: { type: String, required: true, unique: true },
      lang: { type: String, default: 'en' },
    },
    {
      timestamps: true,
    }
  )
);
