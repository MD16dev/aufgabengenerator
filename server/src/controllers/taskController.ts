import { Request, Response, NextFunction } from 'express';
import { getTaskGenerator } from '../services/math/registry';

/**
 * Generates a task for the given type id from the registry.
 * The controller stays untouched no matter how many task types are added.
 */
export const getTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskType = req.params.type;
    const generator = getTaskGenerator(taskType);

    if (!generator) {
      return res.status(404).json({ error: { message: `Unbekannter Aufgabentyp: ${taskType}` } });
    }

    const task = await generator();
    res.json(task);
  } catch (error) {
    next(error);
  }
};
