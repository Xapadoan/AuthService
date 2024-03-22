import type {
  RegisterInitServerOutput,
  RegisterInitServiceInput,
  RegisterUploadServiceInput,
  RegisterUploadServiceOutput,
  RegisterSessionSetupInput,
  RestoreInitServiceInput,
  RestoreInitServerOutput,
  RestoreUploadServiceInput,
  RestoreUploadServiceOutput,
  RestoreSessionSetupInput,
  ResetInitServiceInput,
  ResetInitServerOutput,
  ResetUploadServiceInput,
  ResetUploadServiceOutput,
  ResetSessionSetupInput,
  SessionSetupServerOutput,
} from '@authservice/shared';

export async function initRegister(input: string | URL, email: string) {
  const body: RegisterInitServerOutput = await fetch(input, {
export {
  RegisterInitServerOutput,
  RegisterInitServiceInput,
  RegisterUploadServiceInput,
  RegisterUploadServiceOutput,
  RegisterSessionSetupInput,
  RestoreInitServiceInput,
  RestoreInitServerOutput,
  RestoreUploadServiceInput,
  RestoreUploadServiceOutput,
  RestoreSessionSetupInput,
  ResetInitServiceInput,
  ResetInitServerOutput,
  ResetUploadServiceInput,
  ResetUploadServiceOutput,
  ResetSessionSetupInput,
  SessionSetupServerOutput,
};
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  }).then((res) => handleResponse(res));

  return body;
}

export async function initRestore(input: string | URL, email: string) {
  const body: RestoreInitServerOutput = await fetch(input, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  }).then((res) => handleResponse(res));

  return body;
}

export async function initReset(input: string | URL, email: string) {
  const body: RestoreInitServerOutput = await fetch(input, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  }).then((res) => handleResponse(res));

  return body;
}

export async function uploadRegister(
  input: string | URL,
  payload: RegisterUploadServiceInput
) {
  const body = JSON.stringify(payload);
  await fetch(input, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  }).then((res) => handleResponse<Failable>(res));
}

export async function uploadRestore(
  input: string | URL,
  payload: RestoreUploadServiceInput
) {
  const body = JSON.stringify(payload);
  await fetch(input, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  }).then((res) => handleResponse<Failable>(res));
}

export async function uploadReset(
  input: string | URL,
  payload: ResetUploadServiceInput
) {
  const body = JSON.stringify(payload);
  const response = await fetch(input, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  }).then((res) => handleResponse<Failable>(res));
  console.log('Res: ', response);
  return response;
}

export async function finishRegister(
  input: string | URL,
  EACRegisterToken: string
) {
  await fetch(input, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      EACRegisterToken,
    }),
  });
}

export async function finishRestore(
  input: string | URL,
  EACRestoreToken: string
) {
  await fetch(input, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      EACRestoreToken,
    }),
  });
}

export async function finishReset(input: string | URL, EACResetToken: string) {
  await fetch(input, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      EACResetToken,
    }),
  });
}
