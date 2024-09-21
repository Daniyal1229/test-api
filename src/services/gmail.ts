import { google } from 'googleapis';
import { getGmailOAuthClient } from '../utils/oauthHelper';

export class GmailService {
    private auth: any;

    constructor(accessToken: string) {
        this.auth = getGmailOAuthClient();
        this.auth.setCredentials({ access_token: accessToken });
    }

    async getEmails() {
        const gmail = google.gmail({ version: 'v1', auth: this.auth });
        const response = await gmail.users.messages.list({ userId: 'me' });
        return response.data.messages || [];
    }

    async sendEmail(to: string, subject: string, body: string) {
        const gmail = google.gmail({ version: 'v1', auth: this.auth });
        const message = [
            'Content-Type: text/plain; charset="UTF-8"\r\n',
            'MIME-Version: 1.0\r\n',
            'Content-Transfer-Encoding: 7bit\r\n',
            `To: ${to}\r\n`,
            `Subject: ${subject}\r\n\r\n`,
            body
        ].join('');

        const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
    }
}
