import { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitRecord {
  timestamps: number[];
}

const loginAttempts = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 20; // 20 attempts per minute per IP

// Periodically clean up stale records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    record.timestamps = record.timestamps.filter(t => now - t < WINDOW_MS);
    if (record.timestamps.length === 0) {
      loginAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

export async function loginRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const ip = request.ip || request.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  let record = loginAttempts.get(ip);
  if (!record) {
    record = { timestamps: [] };
    loginAttempts.set(ip, record);
  }

  // Filter timestamps within the sliding window
  record.timestamps = record.timestamps.filter(t => now - t < WINDOW_MS);

  if (record.timestamps.length >= MAX_ATTEMPTS) {
    reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many login attempts. Please try again after 1 minute.',
    });
    return;
  }

  record.timestamps.push(now);
}
