import { Schema, model, Document, Types } from 'mongoose';

export interface IGoal {
  scorer_id: Types.ObjectId;
  team_id: Types.ObjectId;
  assist_id?: Types.ObjectId;
  is_penalty_decider: boolean;
  is_own_goal: boolean;
  minute?: number;
}

export interface IMatch extends Document {
  championship_id: Types.ObjectId;
  evening_date: Date;
  team1_id: Types.ObjectId;
  team2_id: Types.ObjectId;
  score1: number;
  score2: number;
  penalty_winner_id?: Types.ObjectId;
  winner_id: Types.ObjectId;
  goals: IGoal[];
  status: 'scheduled' | 'finished';
  end_time_seconds?: number;
}

const GoalSchema = new Schema<IGoal>(
  {
    scorer_id: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    team_id: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    assist_id: { type: Schema.Types.ObjectId, ref: 'Player' },
    is_penalty_decider: { type: Boolean, default: false },
    is_own_goal: { type: Boolean, default: false },
    minute: { type: Number },
  },
  { _id: false }
);

const MatchSchema = new Schema<IMatch>(
  {
    championship_id: { type: Schema.Types.ObjectId, ref: 'Championship', required: true },
    evening_date: { type: Date, required: true },
    team1_id: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    team2_id: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    score1: { type: Number, default: 0 },
    score2: { type: Number, default: 0 },
    penalty_winner_id: { type: Schema.Types.ObjectId, ref: 'Team' },
    winner_id: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    goals: [GoalSchema],
    status: { type: String, enum: ['scheduled', 'finished'], default: 'scheduled' },
    end_time_seconds: { type: Number },
  },
  { timestamps: true }
);

export default model<IMatch>('Match', MatchSchema);
