import Sweet from '../sweets/sweet.model';
import { AppError } from '../../utils/AppError';

export const purchaseSweet = async (id: string) => {
  const sweet = await Sweet.findById(id);
  if (!sweet) {
    throw new AppError('Sweet not found', 404);
  }

  if (sweet.quantity <= 0) {
    throw new AppError('Out of stock', 400);
  }

  sweet.quantity -= 1;
  await sweet.save();
  return sweet;
};

export const restockSweet = async (id: string, quantity: number) => {
  const sweet = await Sweet.findById(id);
  if (!sweet) {
    throw new AppError('Sweet not found', 404);
  }

  sweet.quantity += Number(quantity);
  await sweet.save();
  return sweet;
};