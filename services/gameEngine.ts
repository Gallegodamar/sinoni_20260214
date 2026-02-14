import { Question, WordData } from '../types';

type WordStat = { wrong: number; attempts: number };

const QUESTIONS_PER_PLAYER = 10;

const shuffleArray = <T,>(array: T[]): T[] => {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

type RandomFn = () => number;

const createSeededRandom = (seed: string): RandomFn => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleWithRandom = <T,>(array: T[], random: RandomFn): T[] => {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

const getWordType = (word: string): string => {
  const normalized = word.toLowerCase().trim();
  if (
    normalized.endsWith('tu') ||
    normalized.endsWith('du') ||
    normalized.endsWith('ten') ||
    normalized.endsWith('tzen')
  ) {
    return 'verb';
  }
  if (normalized.endsWith('ak') || normalized.endsWith('ek')) return 'plural';
  if (
    normalized.endsWith('era') ||
    normalized.endsWith('ura') ||
    normalized.endsWith('tasun')
  ) {
    return 'abstract';
  }
  return 'other';
};

const buildWeightTable = (
  source: WordData[],
  statsMap?: Map<string, WordStat>
): number[] => {
  if (!statsMap || statsMap.size === 0) return source.map(() => 1);
  return source.map((w) => {
    const stats = statsMap.get(String(w.id));
    const wrong = stats?.wrong ?? 0;
    const attempts = stats?.attempts ?? 0;
    const penalty = attempts > 0 ? (wrong / attempts) * 5 : 0;
    return Math.max(1, 1 + wrong * 3 + penalty);
  });
};

const pickWeightedWord = (
  source: WordData[],
  weights: number[],
  totalWeight: number
): WordData => {
  let random = Math.random() * totalWeight;
  for (let i = 0; i < source.length; i += 1) {
    random -= weights[i];
    if (random <= 0) return source[i];
  }
  return source[source.length - 1];
};

export const createQuestionPool = (
  needed: number,
  source: WordData[],
  statsMap?: Map<string, WordStat>
): Question[] => {
  if (!source.length || needed <= 0) return [];

  const weights = buildWeightTable(source, statsMap);
  const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
  const selectedWords = Array.from({ length: needed }, () =>
    pickWeightedWord(source, weights, totalWeight)
  );

  const allWords = Array.from(
    new Set(source.flatMap((word) => [word.hitza, ...word.sinonimoak]))
  );
  const wordsByType = allWords.reduce<Record<string, string[]>>((acc, word) => {
    const type = getWordType(word);
    if (!acc[type]) acc[type] = [];
    acc[type].push(word);
    return acc;
  }, {});

  return selectedWords
    .filter((word) => word.sinonimoak.length > 0)
    .map((wordData) => {
      const correctAnswer =
        wordData.sinonimoak[Math.floor(Math.random() * wordData.sinonimoak.length)];

      const targetType = getWordType(wordData.hitza);
      const candidates = wordsByType[targetType] ?? allWords;
      const distractors = shuffleArray(
        candidates.filter(
          (candidate) =>
            candidate !== wordData.hitza && !wordData.sinonimoak.includes(candidate)
        )
      ).slice(0, 3);
      const options = shuffleArray([correctAnswer, ...distractors]);

      return { wordData, correctAnswer, options };
    });
};

export const createDailyChallengePool = (
  challengeDate: string,
  source: WordData[],
  questionsCount: number
): Question[] => {
  if (!source.length || questionsCount <= 0) return [];

  const random = createSeededRandom(challengeDate);
  const playableSource = source
    .filter((word) => word.sinonimoak.length > 0)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const selected = shuffleWithRandom(playableSource, random).slice(0, questionsCount);
  const allWords = Array.from(
    new Set(playableSource.flatMap((word) => [word.hitza, ...word.sinonimoak]))
  );
  const wordsByType = allWords.reduce<Record<string, string[]>>((acc, word) => {
    const type = getWordType(word);
    if (!acc[type]) acc[type] = [];
    acc[type].push(word);
    return acc;
  }, {});

  return selected.map((wordData) => {
    const correctAnswer =
      wordData.sinonimoak[Math.floor(random() * wordData.sinonimoak.length)];
    const sameType = wordsByType[getWordType(wordData.hitza)] ?? allWords;
    const primaryDistractors = sameType.filter(
      (candidate) =>
        candidate !== wordData.hitza && !wordData.sinonimoak.includes(candidate)
    );
    const fallbackDistractors = allWords.filter(
      (candidate) =>
        candidate !== wordData.hitza && !wordData.sinonimoak.includes(candidate)
    );
    const uniqueDistractors = Array.from(
      new Set([...primaryDistractors, ...fallbackDistractors])
    );
    const distractors = shuffleWithRandom(uniqueDistractors, random).slice(0, 3);
    const options = shuffleWithRandom([correctAnswer, ...distractors], random);

    return { wordData, correctAnswer, options };
  });
};

export const toGameWordCount = (
  playerCount: number,
  isSolo: boolean
): number => (isSolo ? 1 : playerCount) * QUESTIONS_PER_PLAYER;

export const getQuestionsPerPlayer = (): number => QUESTIONS_PER_PLAYER;
