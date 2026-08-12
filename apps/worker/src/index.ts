import fastify from 'fastify';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const server = fastify();

// Connection setup for BullMQ
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Empty BullMQ worker for the specified jobs
const worker = new Worker('lva-jobs', async job => {
  console.log(`Processing job ${job.id} of type ${job.name}`);
  // Add job processing logic here for Phase 1+
}, { connection });

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});

server.get('/health', async (request, reply) => {
  return { status: 'ok', workerStatus: worker.isRunning() };
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log(`Worker service listening on port 3001`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
