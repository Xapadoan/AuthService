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

export type RegisterInitServiceInput = {
  email: string;
};

export type RegisterInitServiceOutput = {
  SVCRegisterToken: string;
};

export type RegisterInitServerOutput = {
  SVCRegisterToken: string;
  EACRegisterToken: string;
  uploadUrl: string;
};

export type RegisterUploadServiceInput = {
  base64Image: string;
  SVCRegisterToken: string;
  EACRegisterToken: string;
};

export type RegisterUploadServiceOutput = Failable;

export type RegisterUploadServerInput = {
  EACRegisterToken: string;
  sessionId: string;
};

export type RegisterSessionSetupInput = {
  userId: string;
  EACRegisterToken: string;
};

export type RestoreInitServiceInput = {
  email: string;
};

export type RestoreInitServiceOutput = {
  SVCRestoreToken: string;
};

export type RestoreInitServerOutput = {
  SVCRestoreToken: string;
  EACRestoreToken: string;
  uploadUrl: string;
};

export type RestoreUploadServiceInput = {
  base64Image: string;
  SVCRestoreToken: string;
  EACRestoreToken: string;
};

export type RestoreUploadServiceOutput = Failable;

export type RestoreUploadServerInput = {
  EACRestoreToken: string;
  sessionId: string;
};

export type RestoreSessionSetupInput = {
  userId: string;
  EACRestoreToken: string;
};

export type ResetInitServiceInput = {
  email: string;
};

export type ResetInitServerOutput = {
  uploadUrl: string;
};

export type ResetConfirmServiceInput = {
  SVCResetToken: string;
};

export type ResetConfirmServerOutput = {
  EACResetToken: string;
};

export type ResetUploadServiceInput = {
  base64Image: string;
  SVCResetToken: string;
};

export type ResetUploadServiceOutput = {
  EACResetToken: string;
};

export type ResetUploadServerInput = {
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
