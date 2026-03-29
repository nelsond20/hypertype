import { config } from 'dotenv';

config();

export function getServerEnv(name: string) {
  return process.env[name];
}
