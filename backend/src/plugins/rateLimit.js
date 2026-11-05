// Rate-limit plugin (CLAUDE.md §11). Registers a global baseline for every route;
// routes that need a stricter cap set `config.rateLimit` (auth: brute force;
// bookings: request spam). Wrapped with fastify-plugin so the limiter applies to
// routes registered after it.
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

// Baseline for any route without its own limit, counted per client IP.
const GLOBAL_LIMIT = { max: 100, timeWindow: '1 minute' };

async function rateLimitPlugin(fastify) {
  await fastify.register(rateLimit, GLOBAL_LIMIT);
}

export default fp(rateLimitPlugin, { name: 'rateLimit' });
