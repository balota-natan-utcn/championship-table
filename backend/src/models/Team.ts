import { Schema, model, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  championship_id: Types.ObjectId;
  name: string;
  color: string;
  player_ids: Types.ObjectId[];
}

const TeamSchema = new Schema<ITeam>(
  {
    championship_id: { type: Schema.Types.ObjectId, ref: 'Championship', required: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#3B82F6' },
    player_ids: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  },
  { timestamps: true }
);

export default model<ITeam>('Team', TeamSchema);
