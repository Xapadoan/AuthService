export interface Integration {
  id: number;
  apiKey: string;
  registerWebhook: string;
  restoreWebhook: string;
  resetConfirmationWebhook: string;
  resetCredentialsWebhook: string;
}

export type Failable<T = Record<string, unknown>> =
  | { success: false; error: string }
  | ({ success: true } & T);

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

export interface RegisterUploadServiceInput {
  base64Image: string;
  SVCRegisterToken: string;
  EACRegisterToken: string;
}

export interface RegisterUploadServiceOutput {
  success: true;
}

export interface RegisterUploadServerInput {
  EACRegisterToken: string;
  apiKey: string;
}
