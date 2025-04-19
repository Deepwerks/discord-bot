import { model, Schema } from "mongoose";

interface IStoredPlayer {
  steamId: string;
  steamIdType: "steamID3" | "steamID" | "steamID64";
  discordId: string;
}

export default model<IStoredPlayer>(
  "StoredPlayer",
  new Schema<IStoredPlayer>(
    {
      discordId: { type: String, required: true, unique: true },
      steamId: { type: String, required: true },
      steamIdType: {
        type: String,
        required: true,
        enum: ["steamID3", "steamID", "steamID64"],
      },
    },
    {
      timestamps: true,
    }
  )
);
