import dotenv from 'dotenv';

dotenv.config();

export const config = {
    sessionSecret: 'sfvhlhdoiausrihachfa;',
    gmail: {
        clientId: process.env.GMAIL_CLIENT_ID!,
        clientSecret: process.env.GMAIL_CLIENT_SECRET!,
        redirectUri: process.env.GMAIL_REDIRECT_URI!,
    },
    outlook: {
        clientId: process.env.OUTLOOK_CLIENT_ID!,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
        redirectUri: process.env.OUTLOOK_REDIRECT_URI!,
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY!,
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
};
