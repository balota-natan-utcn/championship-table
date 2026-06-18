import { Schema, model, Document } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  photo_url: string;
  motto: string;
  createdAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true, trim: true },
    photo_url: { type: String, default: '' },
    motto: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export default model<IPlayer>('Player', PlayerSchema);
