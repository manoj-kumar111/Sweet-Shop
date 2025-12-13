import Sweet, { ISweet } from './sweet.model';
import { AppError } from '../../utils/AppError';

export const createSweet = async (data: Partial<ISweet>) => {
  if (!data.name || !data.category || data.price === undefined || data.quantity === undefined) {
     throw new AppError('Missing required fields', 400);
  }
  if (Number(data.price) < 0 || Number(data.quantity) < 0) {
    throw new AppError('Price and quantity must be non-negative', 400);
  }
  return await Sweet.create(data);
};

export const getAllSweets = async () => {
  return await Sweet.find();
};

export const searchSweets = async (query: any) => {
  const filter: any = {};

  if (query.name) {
    filter.name = { $regex: query.name, $options: 'i' };
  }
  if (query.category) {
    filter.category = { $regex: query.category, $options: 'i' };
  }
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = parseFloat(query.minPrice);
    if (query.maxPrice) filter.price.$lte = parseFloat(query.maxPrice);
  }

  return await Sweet.find(filter);
};

export const updateSweet = async (id: string, data: Partial<ISweet>) => {
  if (data.price !== undefined && Number(data.price) < 0) {
    throw new AppError('Price must be non-negative', 400);
  }
  if (data.quantity !== undefined && Number(data.quantity) < 0) {
    throw new AppError('Quantity must be non-negative', 400);
  }

  const sweet = await Sweet.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!sweet) {
    throw new AppError('Sweet not found', 404);
  }
  return sweet;
};

export const deleteSweet = async (id: string) => {
  const sweet = await Sweet.findByIdAndDelete(id);
  if (!sweet) {
    throw new AppError('Sweet not found', 404);
  }
  return sweet;
};