import { config } from 'dotenv';

config();

export function getServerEnv(name: string) {
  return process.env[name];
}

export function getNumberEnv(name: string, fallback: number) {
  const raw = getServerEnv(name);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function isProductionEnv() {
  const appEnv = getServerEnv('PUBLIC_APP_ENV')?.toLowerCase();
  return process.env.NODE_ENV === 'production' || appEnv === 'production';
}
