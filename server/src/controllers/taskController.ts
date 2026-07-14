import { Request, Response, NextFunction } from 'express';
import { generate2x2DeterminantTask } from '../services/math/determinant';

/**
 * Endpoint controller to generate a new 2x2 determinant task.
 */
export const getDeterminantTask = (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = generate2x2DeterminantTask();
    res.json(task);
  } catch (error) {
    next(error);
  }
};
