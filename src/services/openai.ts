import OpenAI from 'openai';
import { config } from '../config/config';

export class OpenAIService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey,
        });
    }

    async categorizeEmail(content: string): Promise<string> {
        const response = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant that categorizes emails." },
                { role: "user", content: `Categorize this email: ${content}` }
            ],
        });
        return response.choices[0].message.content || 'Uncategorized';
    }

    async generateReply(content: string, category: string): Promise<string> {
        const response = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant that generates email replies." },
                { role: "user", content: `Generate a reply for this ${category} email: ${content}` }
            ],
        });
        return response.choices[0].message.content || 'Unable to generate reply';
    }
}