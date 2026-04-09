import { hasPersistentStorage } from '$lib/infrastructure/persistence/score-repository';
import { isProduction } from '$lib/infrastructure/security/request-guards';
import { getServerEnv } from '$lib/infrastructure/config/env';

export async function getSystemHealth() {
  const showDetails =
    !isProduction() || getServerEnv('EXPOSE_HEALTH_DETAILS') === 'true';
  if (!showDetails) {
    return {
      ok: true,
      service: 'hypertype',
    };
  }

  const hasDatabase = await hasPersistentStorage().catch(() => false);
  return {
    ok: true,
    service: 'hypertype',
    database: hasDatabase ? 'connected' : 'missing',
    environment: isProduction() ? 'production' : 'development',
  };
}
