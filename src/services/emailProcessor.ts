import { GmailService } from './gmail';
import { OutlookService } from './outlook';
import { OpenAIService } from './openai';

export class EmailProcessor {
    private gmailService: GmailService;
    private outlookService: OutlookService;
    private openAIService: OpenAIService;

    constructor(gmailAccessToken: string, outlookAccessToken: string) {
        this.gmailService = new GmailService(gmailAccessToken);
        this.outlookService = new OutlookService(outlookAccessToken);
        this.openAIService = new OpenAIService();
    }

    async processEmails() {
        const gmailEmails = await this.gmailService.getEmails();
        const outlookEmails = await this.outlookService.getEmails();

        const allEmails = [...gmailEmails, ...outlookEmails];

        for (const email of allEmails) {
            const content = email.body || email.snippet;
            const category = await this.openAIService.categorizeEmail(content);
            const reply = await this.openAIService.generateReply(content, category);

            // Send reply
            if (email.service === 'gmail') {
                await this.gmailService.sendEmail(email.from, `Re: ${email.subject}`, reply);
            } else {
                await this.outlookService.sendEmail(email.from, `Re: ${email.subject}`, reply);
            }
        }
    }
}
