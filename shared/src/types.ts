export interface Integration {
  id: number;
  apiKey: string;
  registerWebhook: string;
  restoreWebhook: string;
  resetConfirmationWebhook: string;
  resetCredentialsWebhook: string;
  resetUploadPage: string;
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
  sessionId: string;
};

export interface RestoreInitServiceInput {
export type RegisterSessionSetupInput = {
  userId: string;
  EACRegisterToken: string;
};
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
  sessionId: string;
};

export type RestoreSessionSetupInput = {
  userId: string;
  EACRestoreToken: string;
};

export interface ResetInitServiceInput {
  email: string;
}

export interface RestoreInitServerOutput {
  uploadUrl: string;
}

export interface ResetConfirmServiceInput {
  SVCResetToken: string;
}

export interface ResetConfirmServerOutput {
  EACResetToken: string;
}

export interface ResetUploadServiceInput {
  base64Image: string;
  SVCResetToken: string;
}

export interface ResetUploadServiceOutput {
  EACResetToken: string;
}

export interface ResetUploadServerInput {
  EACResetToken: string;
  sessionId: string;
};

export type ResetSessionSetupInput = {
  userId: string;
  EACResetToken: string;
};

export type SessionSetupServerOutput = {
  sessionId: string;
  maxAge: number;
};
