export interface Integration {
  id: number;
  apiKey: string;
  registerWebhook: string;
  restoreWebhook: string;
  resetConfirmationWebhook: string;
  resetCredentialsWebhook: string;
}

export interface RegisterInitInput {
  email: string;
}

export interface RegisterInitOutput {
  SVCRegisterToken: string;
}
