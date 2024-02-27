export interface Integration {
  id: number;
  apiKey: string;
  registerWebhook: string;
  restoreWebhook: string;
  resetConfirmationWebhook: string;
  resetCredentialsWebhook: string;
}

export interface RegisterInitServiceInput {
  email: string;
}

export interface RegisterInitServiceOutput {
  SVCRegisterToken: string;
}

export interface RegisterInitServerOutput {
  SVCRegisterToken: string;
  EACRegisterToken: string;
  uploadUrl: string;
}
