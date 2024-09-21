import { google } from 'googleapis';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { config } from '../config/config';

export function getGmailOAuthClient() {
    return new google.auth.OAuth2(
        config.gmail.clientId,
        config.gmail.clientSecret,
        config.gmail.redirectUri
    );
}

export function getOutlookOAuthClient() {
    return new ConfidentialClientApplication({
        auth: {
            clientId: config.outlook.clientId,
            clientSecret: config.outlook.clientSecret,
            authority: 'https://login.microsoftonline.com/common',
        },
    });
}

export const outlookScopes = ['openid', 'profile', 'offline_access', 'https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.Send'];
