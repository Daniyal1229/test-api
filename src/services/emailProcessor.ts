import { GmailService } from './gmail';
import { OutlookService } from './outlook';
import { OpenAIService } from './openai';

interface GmailMessage {
    id: string | null;
    payload?: {
        headers?: Array<{name: string, value: string}>;
    };
    snippet?: string;
}

interface Email {
    id: string;
    subject: string;
    from: string;
    body?: string;
    snippet?: string;
    service: 'gmail' | 'outlook';
    category?: string;
}

export class EmailProcessor {
    private gmailService: GmailService;
    private outlookService: OutlookService;
    private openAIService: OpenAIService;

    constructor(gmailAccessToken: string, outlookAccessToken: string) {
        this.gmailService = new GmailService(gmailAccessToken);
        this.outlookService = new OutlookService(outlookAccessToken);
        this.openAIService = new OpenAIService();
    }

    async getCategorizedEmails(service: 'gmail' | 'outlook') {
        let emails: Email[] = [];
        if (service === 'gmail' && this.gmailService) {
            const gmailEmails = await this.gmailService.getEmails() as GmailMessage[];
            emails = gmailEmails.map((email: GmailMessage) => ({
                id: email.id || '',
                subject: email.payload?.headers?.find((h: {name: string, value: string}) => h.name === 'Subject')?.value || '',
                from: email.payload?.headers?.find((h: {name: string, value: string}) => h.name === 'From')?.value || '',
                snippet: email.snippet || '',
                service: 'gmail' as const
            }));
        } else if (service === 'outlook' && this.outlookService) {
            emails = await this.outlookService.getEmails();
        }

        const categorizedEmails = await Promise.all(emails.map(async (email: Email) => {
            const content = email.body || email.snippet || '';
            const category = await this.openAIService.categorizeEmail(content);
            return {
                ...email,
                category
            };
        }));

        return categorizedEmails;
    }
    async processEmails() {
        const gmailEmails = await this.getCategorizedEmails('gmail');
        const outlookEmails = await this.getCategorizedEmails('outlook');

        const allEmails = [...gmailEmails, ...outlookEmails];

        for (const email of allEmails) {
            const content = email.body || email.snippet || '';
            const reply = await this.openAIService.generateReply(content, email.category || 'Uncategorized');

            // Send reply
            if (email.service === 'gmail') {
                await this.gmailService.sendEmail(email.from, `Re: ${email.subject}`, reply);
            } else {
                await this.outlookService.sendEmail(email.from, `Re: ${email.subject}`, reply);
            }
        }
    }
}