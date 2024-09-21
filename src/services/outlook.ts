import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';
import { config } from '../config/config';

export class OutlookService {
    private client: Client;

    constructor(accessToken: string) {
        const authProvider = {
            getAccessToken: async () => {
                if (!accessToken) {
                    throw new Error('No Outlook access token provided');
                }
                return accessToken;
            }
        };

        this.client = Client.initWithMiddleware({
            authProvider: authProvider
        });
    }

    async getEmails() {
        const response = await this.client.api('/me/messages').get();
        return response.value;
    }

    async sendEmail(to: string, subject: string, body: string) {
        await this.client.api('/me/sendMail').post({
            message: {
                subject,
                body: {
                    contentType: 'Text',
                    content: body,
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: to,
                        },
                    },
                ],
            },
        });
    }
}
