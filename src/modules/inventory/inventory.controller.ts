import { Request, Response } from 'express';
import * as inventoryService from './inventory.service';
import { AppError } from '../../utils/AppError';

export const purchase = async (req: Request, res: Response) => {
  try {
    await inventoryService.purchaseSweet(req.params.id);
    res.status(200).json({ message: 'Purchase successful' });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const restock = async (req: Request, res: Response) => {
  try {
    await inventoryService.restockSweet(req.params.id, req.body.quantity);
    res.status(200).json({ message: 'Restock successful' });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};