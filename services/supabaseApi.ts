import type { User } from '@supabase/supabase-js';
import { DifficultyLevel, WordData } from '../types';
import { hasSupabaseConfig, supabase } from '../supabase';

export interface SearchWordResult extends WordData {
  level: number;
}

export interface GameRunRow {
  id: string;
  played_at: string;
  difficulty: number;
  total: number;
  correct: number;
  wrong: number;
  time_seconds: number;
}

export interface FailedWordStat {
  source_id: string | number;
  hitza: string;
  wrong: number;
  attempts: number;
  level: number;
  wrong_rate: number;
}

export type LeaderboardScope = 'daily' | 'weekly' | 'monthly';

export interface DailyChallengeRow {
  id: string;
  user_id: string;
  display_name: string;
  challenge_date: string;
  correct: number;
  wrong: number;
  time_seconds: number;
  played_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  correct: number;
  wrong: number;
  time_seconds: number;
  attempts: number;
}

export interface GameAnswerInsert {
  user_id: string;
  level: DifficultyLevel;
  source_id: string | number;
  hitza: string;
  chosen: string;
  correct: string;
  is_correct: boolean;
}

export const getCurrentUser = async (): Promise<User | null> => {
  if (!hasSupabaseConfig) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
};

export const signIn = async (username: string, password: string) => {
  if (!hasSupabaseConfig) {
    return {
      data: { user: null, session: null },
      error: new Error(
        'Supabase is not configured. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      ),
    };
  }
  const email = username.includes('@') ? username : `${username}@tuapp.local`;
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  if (!hasSupabaseConfig) return;
  await supabase.auth.signOut();
};

export const searchWords = async (term: string): Promise<SearchWordResult[]> => {
  if (!hasSupabaseConfig) return [];
  const normalized = term.trim().toLowerCase();
  if (normalized.length < 2) return [];

  const { data, error } = await supabase
    .from('syn_words')
    .select('source_id, hitza, sinonimoak, level')
    .ilike('search_text', `%${normalized}%`)
    .eq('active', true)
    .limit(50);

  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.source_id,
    hitza: row.hitza,
    sinonimoak: Array.isArray(row.sinonimoak) ? row.sinonimoak : [],
    level: row.level,
  }));
};

export const fetchWordsByLevel = async (
  level: DifficultyLevel
): Promise<WordData[]> => {
  if (!hasSupabaseConfig) return [];
  const { data, error } = await supabase
    .from('syn_words')
    .select('source_id, hitza, sinonimoak')
    .eq('level', level)
    .eq('active', true);

  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.source_id,
    hitza: row.hitza,
    sinonimoak: Array.isArray(row.sinonimoak) ? row.sinonimoak : [],
  }));
};

export const fetchAllActiveWords = async (): Promise<WordData[]> => {
  if (!hasSupabaseConfig) return [];
  const { data, error } = await supabase
    .from('syn_words')
    .select('source_id, hitza, sinonimoak')
    .eq('active', true);

  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.source_id,
    hitza: row.hitza,
    sinonimoak: Array.isArray(row.sinonimoak) ? row.sinonimoak : [],
  }));
};

export const fetchGameRuns = async (userId: string): Promise<GameRunRow[]> => {
  if (!hasSupabaseConfig) return [];
  const { data, error } = await supabase
    .from('game_runs')
    .select('id, played_at, difficulty, total, correct, wrong, time_seconds')
    .eq('user_id', userId)
    .order('played_at', { ascending: false });

  if (error || !data) return [];
  return data as GameRunRow[];
};

export const fetchFailedWords = async (
  userId: string
): Promise<FailedWordStat[]> => {
  if (!hasSupabaseConfig) return [];
  const { data, error } = await supabase
    .from('game_answers')
    .select('source_id, hitza, is_correct, level')
    .eq('user_id', userId);

  if (error || !data) return [];

  const map = new Map<
    string,
    { source_id: string | number; hitza: string; wrong: number; attempts: number; level: number }
  >();

  for (const row of data as any[]) {
    const key = `${row.source_id}_${row.level}`;
    const current = map.get(key) ?? {
      source_id: row.source_id,
      hitza: row.hitza,
      wrong: 0,
      attempts: 0,
      level: row.level,
    };
    current.attempts += 1;
    if (!row.is_correct) current.wrong += 1;
    map.set(key, current);
  }

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      wrong_rate: item.attempts ? (item.wrong / item.attempts) * 100 : 0,
    }))
    .filter((item) => item.attempts > 1);
};

export const insertGameAnswers = async (answers: GameAnswerInsert[]) => {
  if (!hasSupabaseConfig || !answers.length) return;
  await supabase.from('game_answers').insert(answers);
};

export const insertGameRun = async (payload: {
  user_id: string;
  played_at: string;
  difficulty: DifficultyLevel;
  total: number;
  correct: number;
  wrong: number;
  time_seconds: number;
}) => {
  if (!hasSupabaseConfig) return;
  await supabase.from('game_runs').insert(payload);
};

export const hasPlayedDailyChallenge = async (
  userId: string,
  challengeDate: string
): Promise<boolean> => {
  if (!hasSupabaseConfig) return false;
  const { data, error } = await supabase
    .from('daily_challenge_runs')
    .select('id')
    .eq('user_id', userId)
    .eq('challenge_date', challengeDate)
    .limit(1);

  if (error) return false;
  return Array.isArray(data) && data.length > 0;
};

export const upsertDailyChallengeRun = async (payload: {
  user_id: string;
  display_name: string;
  challenge_date: string;
  correct: number;
  wrong: number;
  time_seconds: number;
  played_at: string;
}) => {
  if (!hasSupabaseConfig) return;
  await supabase.from('daily_challenge_runs').upsert(payload, {
    onConflict: 'user_id,challenge_date',
  });
};

const getRangeStartDate = (scope: LeaderboardScope, challengeDate: string): string => {
  const base = new Date(`${challengeDate}T00:00:00.000Z`);
  if (scope === 'daily') return challengeDate;
  if (scope === 'weekly') {
    const day = base.getUTCDay();
    const offset = (day + 6) % 7;
    base.setUTCDate(base.getUTCDate() - offset);
    return base.toISOString().slice(0, 10);
  }
  base.setUTCDate(1);
  return base.toISOString().slice(0, 10);
};

export const fetchDailyLeaderboard = async (
  scope: LeaderboardScope,
  challengeDate: string
): Promise<LeaderboardEntry[]> => {
  if (!hasSupabaseConfig) return [];

  const rangeStart = getRangeStartDate(scope, challengeDate);
  const { data, error } = await supabase
    .from('daily_challenge_runs')
    .select('id, user_id, display_name, challenge_date, correct, wrong, time_seconds, played_at')
    .gte('challenge_date', rangeStart)
    .lte('challenge_date', challengeDate);

  if (error || !data) return [];

  const rows = data as DailyChallengeRow[];
  if (scope === 'daily') {
    return rows
      .filter((row) => row.challenge_date === challengeDate)
      .map((row) => ({
        user_id: row.user_id,
        display_name: row.display_name,
        correct: row.correct,
        wrong: row.wrong,
        time_seconds: row.time_seconds,
        attempts: 1,
      }))
      .sort((a, b) =>
        b.correct === a.correct ? a.time_seconds - b.time_seconds : b.correct - a.correct
      );
  }

  const aggregated = new Map<string, LeaderboardEntry>();
  for (const row of rows) {
    const current = aggregated.get(row.user_id) ?? {
      user_id: row.user_id,
      display_name: row.display_name,
      correct: 0,
      wrong: 0,
      time_seconds: 0,
      attempts: 0,
    };
    current.correct += row.correct;
    current.wrong += row.wrong;
    current.time_seconds += row.time_seconds;
    current.attempts += 1;
    aggregated.set(row.user_id, current);
  }

  return Array.from(aggregated.values()).sort((a, b) =>
    b.correct === a.correct ? a.time_seconds - b.time_seconds : b.correct - a.correct
  );
};
