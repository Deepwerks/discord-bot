import { model, Schema } from 'mongoose';

export interface IDeadlockMatchPlayerSchema {
  account_id: number;
  name: string;

  player_slot: number;
  team: number;
  hero_id: number;
  party: number;

  kills: number;
  deaths: number;
  assists: number;
  net_worth: number;
  last_hits: number;
  denies: number;
  ability_points: number;

  assigned_lane: number;

  damage_dealt: number;
  obj_damage: number;
  healing: number;
  damage_taken: number;
}

export interface IDeadlockMatchSchema {
  match_id: number;
  start_time: number;

  duration_s: number;
  match_outcome: number;
  winning_team: number;

  team_0_players: IDeadlockMatchPlayerSchema[];
  team_1_players: IDeadlockMatchPlayerSchema[];

  average_badge_team0: number;
  average_badge_team1: number;
}

const DeadlockMatchPlayerSchema = new Schema<IDeadlockMatchPlayerSchema>({
  account_id: { type: Number, required: true },
  name: { type: String, required: true },

  player_slot: { type: Number, required: true },
  team: { type: Number, required: true },
  hero_id: { type: Number, required: true },
  party: { type: Number, required: true },

  kills: { type: Number, required: true },
  deaths: { type: Number, required: true },
  assists: { type: Number, required: true },
  net_worth: { type: Number, required: true },
  last_hits: { type: Number, required: true },
  denies: { type: Number, required: true },
  ability_points: { type: Number, required: true },

  assigned_lane: { type: Number, required: true },

  damage_dealt: { type: Number, required: true },
  obj_damage: { type: Number, required: true },
  healing: { type: Number, required: true },
  damage_taken: { type: Number, required: true },
});

const DeadlockMatchSchema = new Schema<IDeadlockMatchSchema>(
  {
    match_id: { type: Number, required: true, unique: true },
    start_time: { type: Number, required: true },
    duration_s: { type: Number, required: true },
    match_outcome: { type: Number, required: true },
    winning_team: { type: Number, required: true },

    team_0_players: { type: [DeadlockMatchPlayerSchema], required: true },
    team_1_players: { type: [DeadlockMatchPlayerSchema], required: true },

    average_badge_team0: { type: Number, required: true },
    average_badge_team1: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

DeadlockMatchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 4 * 7 * 24 * 60 * 60 });
export default model<IDeadlockMatchSchema>('DeadlockMatch', DeadlockMatchSchema);
