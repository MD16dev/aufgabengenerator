import { TaskData } from './types';
import { prisma } from '../../utils/db';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function generateBusAnkiTask(): Promise<TaskData> {
  const count = await prisma.busQuestion.count();
  if (count === 0) {
    throw new Error('Keine BUS-Aufgaben in der Datenbank gefunden. Bitte lade die Aufgaben zuerst.');
  }

  const randomIndex = Math.floor(Math.random() * count);
  const busQuestion = await prisma.busQuestion.findFirst({
    skip: randomIndex,
  });

  if (!busQuestion) {
    throw new Error('Aufgabe konnte nicht geladen werden.');
  }

  // Gather correct answer and distractors
  const correct = busQuestion.correctAnswer;
  const rawOptions = [
    correct,
    busQuestion.distractor1,
    busQuestion.distractor2,
    busQuestion.distractor3,
  ];

  // Shuffle the options
  const options = shuffleArray(rawOptions);

  // Build the explanation array from the stored explanation (if present)
  const explanation = busQuestion.explanation
    ? [
        `Die richtige Antwort lautet: <strong>${correct}</strong>`,
        busQuestion.explanation,
      ]
    : [`Die richtige Antwort lautet: <strong>${correct}</strong>`];

  // Convert options to choices format (id = option text, used for comparison)
  const choices = options.map((opt) => ({ id: opt, caption: opt }));

  return {
    type: 'os_bus_anki',
    // We store the question in prompt to avoid math-rendering it in standard mathQuery
    prompt: busQuestion.question,
    mathQuery: '',
    answer: correct,
    choices,
    explanation,
  };
}
