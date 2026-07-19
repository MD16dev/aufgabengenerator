/**
 * Unified task data shape returned by every generator in the registry.
 * The frontend (GenericTaskRunner) only needs these fields and does not
 * care which mathematical domain the task belongs to.
 */
export interface TaskData {
  /** Stable task type id, e.g. "lin_alg_det". Used for scoring/leaderboard. */
  type: string;
  /** The LaTeX expression to render (the "question"). */
  mathQuery: string;
  /** The expected answer as a string. Compared against the normalized user input. */
  answer: string;
  /** Optional step-by-step LaTeX explanation shown when the user reveals the solution. */
  explanation?: string[];
  /** Optional human-readable prompt shown above the math expression. */
  prompt?: string;
  /** Optional input hint, e.g. "Gib das Ergebnis als Dezimalzahl ein." */
  inputHint?: string;
  /** Optional options for multiple choice tasks. */
  options?: string[];
}
