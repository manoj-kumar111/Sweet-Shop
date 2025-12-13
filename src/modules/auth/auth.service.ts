import User from './user.model';
import { hashPassword, comparePassword, generateToken } from '../../utils/jwt';
import { AppError } from '../../utils/AppError';

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const registerUser = async (email: string, password: string, role: 'USER' | 'ADMIN' = 'USER') => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }
  if (!validateEmail(email)) {
    throw new AppError('Invalid email format', 400);
  }
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({ email, password: hashedPassword, role });
  
  const userObj = user.toObject();
  delete userObj.password;
  
  return userObj;
};

export const loginUser = async (email: string, password: string) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email });
  if (!user || !user.password) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken(user._id as string, user.role);
  return { token, user };
};