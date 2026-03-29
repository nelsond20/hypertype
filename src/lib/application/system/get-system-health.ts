import { hasPersistentStorage } from '$lib/infrastructure/persistence/score-repository';
import { isProduction } from '$lib/infrastructure/security/request-guards';

export async function getSystemHealth() {
  const hasDatabase = await hasPersistentStorage().catch(() => false);

  return {
    ok: true,
    service: 'hypertype',
    database: hasDatabase ? 'connected' : 'missing',
    environment: isProduction() ? 'production' : 'development',
  };
}
