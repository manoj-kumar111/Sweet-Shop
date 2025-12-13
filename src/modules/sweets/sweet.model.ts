import mongoose, { Schema, Document } from 'mongoose';

export interface ISweet extends Document {
  name: string;
  category: string;
  price: number;
  quantity: number;
}

const SweetSchema: Schema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0 },
});

export default mongoose.model<ISweet>('Sweet', SweetSchema);