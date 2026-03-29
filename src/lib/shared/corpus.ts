import seedrandom from 'seedrandom';
import type { Difficulty, GeneratedText, Language, TextLength } from './types';

const corpus: Record<Difficulty, Record<Language, string[]>> = {
  easy: {
    typescript: [
      'const status = "ready";',
      'function add(a: number, b: number) { return a + b; }',
      'let count = 0; count += 1;',
    ],
    javascript: [
      'const total = items.length;',
      'function greet(name) { return `hello ${name}`; }',
      'let ready = true;',
    ],
    python: [
      'def total(items):\n    return sum(items)',
      'name = "hypertype"',
      'for item in items:\n    print(item)',
    ],
    rust: [
      'let ready = true;',
      'fn add(a: i32, b: i32) -> i32 { a + b }',
      'let items = vec![1, 2, 3];',
    ],
    sql: [
      'SELECT id, name FROM users;',
      'UPDATE scores SET wpm = 72 WHERE id = 1;',
      'INSERT INTO sessions (name, duration_ms) VALUES ("Guest", 30000);',
    ],
    go: [
      'func add(a int, b int) int { return a + b }',
      'fmt.Println("hello world")',
      'items := []string{"a", "b", "c"}',
    ],
  },
  medium: {
    typescript: [
      'type GameState = { wpm: number; accuracy: number; active: boolean };',
      'const pace = entries.filter((entry) => entry.kind !== "meta").length;',
      'export function rankScore(score: number) { return score > 100 ? "top" : "steady"; }',
    ],
    javascript: [
      'const buffer = input.trim().split(/\\s+/g);',
      'function buildSession(seed) { return { seed, createdAt: Date.now() }; }',
      'const rate = Math.max(1, Math.round(chars / minutes));',
    ],
    python: [
      'def score(chars, minutes):\n    return round(chars / 5 / minutes, 2)',
      'result = [row.strip() for row in rows if row]',
      'summary = {"accuracy": accuracy, "errors": errors}',
    ],
    rust: [
      'let ratio = if keystrokes == 0 { 0.0 } else { correct as f32 / keystrokes as f32 };',
      'fn normalize(input: &str) -> String { input.trim().to_string() }',
      'let mut scores = vec![42, 87, 91]; scores.sort();',
    ],
    sql: [
      'SELECT difficulty, COUNT(*) AS plays FROM sessions GROUP BY difficulty ORDER BY plays DESC;',
      'WITH recent AS (SELECT * FROM scores ORDER BY created_at DESC LIMIT 20) SELECT AVG(wpm) FROM recent;',
      'DELETE FROM sessions WHERE created_at < NOW() - INTERVAL "30 days";',
    ],
    go: [
      'func clamp(n, min, max int) int { if n < min { return min }; if n > max { return max }; return n }',
      'if err != nil { return fmt.Errorf("save score: %w", err) }',
      'sessions := make([]Session, 0, 16)',
    ],
  },
  hard: {
    typescript: [
      'const query = `SELECT * FROM events WHERE payload->>"kind" = "typing"`;',
      'const reducer = <T,>(state: T[], next: T) => [...state, next];',
      'type Result<T> = Promise<{ data: T; elapsedMs: number }>;',
    ],
    javascript: [
      'const regex = /^(?:[a-z]+-){2,}[a-z]+$/i;',
      'await Promise.allSettled(queue.map((task) => task.run()));',
      'const config = { retries: 3, timeout: 2500, cache: false };',
    ],
    python: [
      'payload = {"items": [x for x in rows if x["active"]], "meta": meta.copy()}',
      'pattern = re.compile(r"^[a-z_]+\\d{2,}$")',
      'with open(path, "r", encoding="utf-8") as fh:\n    content = fh.read()',
    ],
    rust: [
      'let output = tokens.iter().map(|token| token.trim()).collect::<Vec<_>>().join(" ");',
      'match state {\n    Some(value) => Ok(value),\n    None => Err(Error::Missing),\n}',
      'let parsed: Result<Vec<_>, _> = lines.map(str::parse).collect();',
    ],
    sql: [
      'SELECT u.name, COUNT(r.id) FILTER (WHERE r.success) AS wins FROM users u LEFT JOIN runs r ON r.user_id = u.id GROUP BY u.name;',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scores_wpm ON scores (difficulty, wpm DESC);',
      'SELECT jsonb_build_object("accuracy", accuracy, "errors", errors) FROM scores WHERE duration_ms BETWEEN 30000 AND 60000;',
    ],
    go: [
      'decoder := json.NewDecoder(strings.NewReader(raw)); if err := decoder.Decode(&payload); err != nil { return err }',
      'func merge[T any](left, right []T) []T { return append(left, right...) }',
      'ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)',
    ],
  },
};

const lengthMap: Record<TextLength, number> = {
  short: 180,
  medium: 320,
  long: 520,
};

export function generateCorpusText({
  difficulty,
  language,
  seed,
  textLength,
}: {
  difficulty: Difficulty;
  language: Language;
  seed: number;
  textLength: TextLength;
}): GeneratedText {
  const rng = seedrandom(`${difficulty}:${language}:${seed}`);
  const bank = corpus[difficulty][language];
  const targetChars = lengthMap[textLength];
  const segments: string[] = [];
  let current = '';

  while (current.length < targetChars) {
    const choice = bank[Math.floor(rng() * bank.length)];
    segments.push(choice);
    current = segments.join('\n');
  }

  return {
    text: segments.join('\n'),
    seed,
    difficulty,
    language,
    targetChars,
  };
}

export function getCorpusPreview(difficulty: Difficulty, language: Language) {
  return corpus[difficulty][language][0];
}
