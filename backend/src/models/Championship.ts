import { Schema, model, Document, Types } from 'mongoose';

export interface IChampionship extends Document {
  name: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'finished';
  winner_team_id?: Types.ObjectId;
  createdAt: Date;
}

const ChampionshipSchema = new Schema<IChampionship>(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'finished'], default: 'active' },
    winner_team_id: { type: Schema.Types.ObjectId, ref: 'Team' },
  },
  { timestamps: true }
);

export default model<IChampionship>('Championship', ChampionshipSchema);
