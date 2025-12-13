import { Request, Response } from 'express';
import * as sweetService from './sweet.service';
import { AppError } from '../../utils/AppError';

export const create = async (req: Request, res: Response) => {
  try {
    const sweet = await sweetService.createSweet(req.body);
    res.status(201).json({ sweet });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const sweets = await sweetService.getAllSweets();
    res.status(200).json(sweets);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const search = async (req: Request, res: Response) => {
  try {
    const sweets = await sweetService.searchSweets(req.query);
    res.status(200).json(sweets);
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const sweet = await sweetService.updateSweet(req.params.id, req.body);
    res.status(200).json({ sweet });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await sweetService.deleteSweet(req.params.id);
    res.status(200).json({ message: 'Sweet deleted' });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};