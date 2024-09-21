import express from 'express';
import path from 'path';
import { emailQueue } from './queues/emailQueue';
import { config } from './config/config';
import { getGmailOAuthClient, getOutlookOAuthClient, outlookScopes } from './utils/oauthHelper';
import { google } from 'googleapis';
import cors from 'cors';
import { EmailProcessor } from './services/emailProcessor';


const app = express();

app.use(express.json());
app.use(cors())
// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Gmail OAuth
app.get('/auth/gmail', (req, res) => {
    const oauth2Client = getGmailOAuthClient();
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
    });
    res.json({ authUrl });
});

app.get('/auth/gmail/callback', async (req, res) => {
    const oauth2Client = getGmailOAuthClient();
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code as string);
        res.send(`
            <script>
                localStorage.setItem('gmailAccessToken', '${tokens.access_token}');
                window.opener.postMessage('gmailAuthenticated', '*');
            </script>
        `);
    } catch (error) {
        console.error('Error getting Gmail tokens:', error);
        res.status(500).send('Error authenticating with Gmail');
    }
});

// Outlook OAuth
app.get('/auth/outlook', async (req, res) => {
    const msalInstance = getOutlookOAuthClient();
    const authCodeUrlParameters = {
        scopes: outlookScopes,
        redirectUri: config.outlook.redirectUri,
    };
    const authUrl = await msalInstance.getAuthCodeUrl(authCodeUrlParameters);
    res.json({ authUrl });
});

app.get('/test-gmail', async (req, res) => {
    const accessToken = req.query.accessToken as string;
    if (!accessToken) {
        return res.status(400).json({ error: 'Access token is required' });
    }

    const oauth2Client = getGmailOAuthClient();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
        const response = await gmail.users.messages.list({ userId: 'me', maxResults: 10 });
        const messages = response.data.messages || [];

        const emailDetails = await Promise.all(messages.map(async (message) => {
            const details = await gmail.users.messages.get({ userId: 'me', id: message.id || '' });
            const messageDetails = details.data;
            return {
                id: message.id,
                subject: messageDetails.payload?.headers?.find((header) => header.name === 'Subject')?.value || 'No Subject',
                snippet: messageDetails.snippet || 'No snippet available'
            };
        }));

        res.json({ message: 'Gmail test successful', count: messages.length, emails: emailDetails });
    } catch (error) {
        console.error('Error testing Gmail:', error);
        res.status(500).json({
            error: 'Error testing Gmail',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.get('/auth/outlook/callback', async (req, res) => {
    const msalInstance = getOutlookOAuthClient();
    const { code } = req.query;
    try {
        const tokenRequest = {
            code: code as string,
            scopes: outlookScopes,
            redirectUri: config.outlook.redirectUri,
        };
        const authResult = await msalInstance.acquireTokenByCode(tokenRequest);
        res.send(`
            <script>
                localStorage.setItem('outlookAccessToken', '${authResult.accessToken}');
                window.opener.postMessage('outlookAuthenticated', '*');
            </script>
        `);
    } catch (error) {
        console.error('Error getting Outlook tokens:', error);
        res.status(500).send('Error authenticating with Outlook');
    }
});

app.post('/process-emails', async (req, res) => {
    const { gmailAccessToken, outlookAccessToken } = req.body;
    await emailQueue.add('process-emails', { gmailAccessToken, outlookAccessToken });
    res.json({ message: 'Email processing job added to the queue' });
});


app.get('/categorized-emails', async (req, res) => {
    const gmailAccessToken = req.query.gmailAccessToken as string;
    const outlookAccessToken = req.query.outlookAccessToken as string;

    interface CategorizedEmail {
        id: string;
        subject: string;
        from: string;
        body?: string;
        snippet?: string;
        category: string;
        service: 'gmail' | 'outlook';
    }

    let categorizedEmails: CategorizedEmail[] = [];

    if (gmailAccessToken) {
        const gmailProcessor = new EmailProcessor(gmailAccessToken, '');
        const gmailEmails = await gmailProcessor.getCategorizedEmails('gmail');
        categorizedEmails = [...categorizedEmails, ...gmailEmails];
    }

    if (outlookAccessToken) {
        const outlookProcessor = new EmailProcessor('', outlookAccessToken);
        const outlookEmails = await outlookProcessor.getCategorizedEmails('outlook');
        categorizedEmails = [...categorizedEmails, ...outlookEmails];
    }

    res.json({
        message: 'Categorized emails retrieved successfully',
        emails: categorizedEmails
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

