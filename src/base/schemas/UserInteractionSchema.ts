import { model, Schema } from "mongoose";

export enum InteractionType {
  Command = "command",
  Button = "button",
  SelectMenu = "selectMenu",
  Modal = "modal",
}

export interface IUserInteractionSchema {
  interactionName: string;
  interactionType: InteractionType;
  userId: string;
  guildId: string | null;
  timestamp: Date;
}

export default model<IUserInteractionSchema>(
  "UserInteraction",
  new Schema<IUserInteractionSchema>({
    interactionName: String,
    interactionType: {
      type: String,
      enum: ["command", "button", "selectMenu", "modal"],
    },
    userId: String,
    guildId: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  })
);
