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

export interface RegisterUploadServerInput {
  EACRegisterToken: string;
  apiKey: string;
}

export interface RestoreInitServiceInput {
  email: string;
}

export interface RestoreInitServiceOutput {
  SVCRestoreToken: string;
}

export interface RestoreInitServerOutput {
  SVCRestoreToken: string;
  EACRestoreToken: string;
  uploadUrl: string;
}

export interface RestoreUploadServiceInput {
  base64Image: string;
  SVCRestoreToken: string;
  EACRestoreToken: string;
}

export interface RestoreUploadServerInput {
  EACRestoreToken: string;
  apiKey: string;
}
