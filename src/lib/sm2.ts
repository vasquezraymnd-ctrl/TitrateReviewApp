import { Progress } from './db';

/**
 * SuperMemo 2 (SM-2) Algorithm Implementation
 * Quality: 0-5
 * 5: perfect response
 * 4: correct response after a hesitation
 * 3: correct response recalled with serious difficulty
 * 2: incorrect response; where the correct one seemed easy to recall
 * 1: incorrect response; the correct one remembered
 * 0: complete blackout.
 */
export function calculateSM2(
  quality: number,
  previousProgress?: Progress
): Omit<Progress, 'questionId'> {
  let interval: number;
  let repetition: number;
  let easeFactor: number;

  const prevRepetition = previousProgress?.repetition || 0;
  const prevInterval = previousProgress?.interval || 0;
  const prevEaseFactor = previousProgress?.easeFactor || 2.5;

  if (quality >= 3) {
    // Correct response
    if (prevRepetition === 0) {
      interval = 1;
    } else if (prevRepetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * prevEaseFactor);
    }
    repetition = prevRepetition + 1;
  } else {
    // Incorrect response
    repetition = 0;
    interval = 1;
  }

  // Calculate new Ease Factor
  easeFactor = prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextDueDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    interval,
    repetition,
    easeFactor,
    nextDueDate,
  };
}
