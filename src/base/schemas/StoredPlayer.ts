import { model, Schema } from "mongoose";

interface IStoredPlayer {
  steamId: string;
  steamIdType: string;
  discordId: string;
}

export default model<IStoredPlayer>(
  "StoredPlayer",
  new Schema<IStoredPlayer>(
    {
      discordId: { type: String, required: true, unique: true },
      steamId: { type: String, required: true },
      steamIdType: { type: String, required: true },
    },
    {
      timestamps: true,
    }
  )
);
