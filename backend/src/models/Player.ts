import { Schema, model, Document } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  photo_url: string;
  createdAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true, trim: true },
    photo_url: { type: String, default: '' },
  },
  { timestamps: true }
);

export default model<IPlayer>('Player', PlayerSchema);
