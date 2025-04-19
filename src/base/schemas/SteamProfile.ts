import { model, Schema } from "mongoose";

interface ISteamProfile {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatarmedium: string;
  discordid?: string;
}

export default model<ISteamProfile>(
  "SteamProfile",
  new Schema<ISteamProfile>(
    {
      steamid: { type: String, required: true, unique: true },
      personaname: { type: String, required: true },
      profileurl: { type: String, required: true },
      avatarmedium: { type: String, required: true },
      discordid: { type: String, required: false },
    },
    {
      timestamps: true,
    }
  )
);
