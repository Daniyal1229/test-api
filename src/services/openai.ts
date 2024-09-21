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
        const prompt = `Categorize the following email content as "Interested", "NotInterested", or "More information":\n\n${content}`;
        const response = await this.openai.completions.create({
            model: 'text-davinci-002',
            prompt,
            max_tokens: 50,
            n: 1,
            stop: null,
            temperature: 0.5,
        });

        return response.choices[0].text?.trim() || 'More information';
    }

    async generateReply(content: string, category: string): Promise<string> {
        const prompt = `Generate a reply for the following email content, which is categorized as "${category}":\n\n${content}\n\nReply:`;
        const response = await this.openai.completions.create({
            model: 'text-davinci-002',
            prompt,
            max_tokens: 200,
            n: 1,
            stop: null,
            temperature: 0.7,
        });

        return response.choices[0].text?.trim() || '';
    }
}
