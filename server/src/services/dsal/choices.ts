import { ChoiceOption, TreeNodeJSON } from '../math/types';

/** Stable structural key of a tree (ignores choice ids). */
export function shapeKey(n: TreeNodeJSON | null | undefined): string {
  if (!n) return '()';
  if (n.values && n.values.length > 0) {
    const vals = n.values.join(',');
    const kids = (n.children ?? []).map((c) => shapeKey(c)).join('|');
    return `(${vals}[${kids}])`;
  }
  const color = n.color === 'red' ? 'r' : n.color === 'black' ? 'b' : '';
  const h = n.height !== undefined ? `h${n.height}` : '';
  return `(${n.value ?? ''}${color}${h}${shapeKey(n.left ?? null)}${shapeKey(n.right ?? null)})`;
}

/**
 * Build a list of exactly `count` distinct multiple-choice options where the
 * first entry is the correct answer. `candidateFactories` produce candidate
 * distractor trees; duplicates (against the correct tree or each other) are
 * dropped, and if we still need more, `fallbackFactory` is called repeatedly
 * (it should mutate the tree to stay wrong but unique).
 */
export function buildDistinctChoices(
  correctTree: TreeNodeJSON,
  candidateFactories: (() => TreeNodeJSON | null)[],
  fallbackFactory: (index: number) => TreeNodeJSON | null,
  count = 4,
): ChoiceOption[] {
  const correctKey = shapeKey(correctTree);
  const seen = new Set<string>([correctKey]);
  const distractors: TreeNodeJSON[] = [];

  for (const factory of candidateFactories) {
    if (distractors.length + 1 >= count) break;
    const tree = factory();
    if (!tree) continue;
    const key = shapeKey(tree);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(tree);
  }

  let i = 0;
  while (distractors.length + 1 < count) {
    const tree = fallbackFactory(i++);
    if (!tree) break;
    const key = shapeKey(tree);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(tree);
  }

  const choices: ChoiceOption[] = [{ id: 'a', tree: correctTree }];
  const letters = 'bcdefghijklmnop';
  distractors.forEach((tree, idx) => {
    choices.push({ id: letters[idx], tree });
  });
  return choices;
}

/** Fisher-Yates shuffle (in place). */
export function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
