import { Queue, Worker } from 'bullmq';
import { config } from '../config/config';
import { EmailProcessor } from '../services/emailProcessor';

const emailQueue = new Queue('email-processing', {
    connection: {
        host: config.redis.host,
        port: config.redis.port,
    },
});

const worker = new Worker('email-processing', async (job) => {
    const { gmailAccessToken, outlookAccessToken } = job.data;
    const emailProcessor = new EmailProcessor(gmailAccessToken, outlookAccessToken);
    await emailProcessor.processEmails();
}, {
    connection: {
        host: config.redis.host,
        port: config.redis.port,
    },
});

export { emailQueue };
