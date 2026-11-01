import { useTranslation } from "react-i18next";
import { Badge, type BadgeTone } from "./Badge";

export const DIFFICULTY_WORDS = ["beginner", "intermediate", "advanced", "technical"] as const;

export type DifficultyWord = (typeof DIFFICULTY_WORDS)[number];

/** Declared difficulty 1 to 5 as one of the design's four words (spec site/map). */
export function difficultyWord(difficulty: number): DifficultyWord {
  if (difficulty <= 1) return "beginner";
  if (difficulty <= 3) return "intermediate";
  return difficulty === 4 ? "advanced" : "technical";
}

/** The levels a word stands for: the reverse of {@link difficultyWord}. */
export function levelsOf(word: DifficultyWord): number[] {
  return [1, 2, 3, 4, 5].filter((level) => difficultyWord(level) === word);
}

const TONES: Record<DifficultyWord, BadgeTone> = {
  beginner: "success",
  intermediate: "info",
  advanced: "caution",
  technical: "danger",
};

export function DifficultyBadge({ difficulty }: { difficulty: number }) {
  const { t } = useTranslation();
  const word = difficultyWord(difficulty);
  return <Badge tone={TONES[word]}>{t(`site.difficulty.${word}`)}</Badge>;
}
