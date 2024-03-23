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

async function jsonFetcher<T extends object>(url: string | URL, payload: T) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    return res.json();
  });
}

export async function initRegister<
  T extends RegisterInitServiceInput,
  P extends RegisterInitServerOutput,
>(url: string | URL, payload: T) {
  const body: P = await jsonFetcher(url, payload);
  return body;
}

export async function initRestore<
  T extends RestoreInitServiceInput,
  P extends RestoreInitServerOutput,
>(url: string | URL, payload: T) {
  const body: P = await jsonFetcher(url, payload);
  return body;
}

export async function initReset<
  T extends ResetInitServiceInput,
  P extends ResetInitServerOutput,
>(url: string | URL, payload: T) {
  const body: P = await jsonFetcher(url, payload);
  return body;
}

export async function uploadRegister(
  input: string | URL,
  payload: RegisterUploadServiceInput
) {
  const body: RegisterUploadServiceOutput = await jsonFetcher(input, payload);
  return body;
}

export async function uploadRestore(
  input: string | URL,
  payload: RestoreUploadServiceInput
) {
  const body: RestoreUploadServiceOutput = await jsonFetcher(input, payload);
  return body;
}

export async function uploadReset(
  input: string | URL,
  payload: ResetUploadServiceInput
) {
  const body: ResetUploadServiceOutput = await jsonFetcher(input, payload);
  return body;
}

export async function finishRegister<
  T extends Omit<RegisterSessionSetupInput, 'userId'>,
  P extends SessionSetupServerOutput,
>(url: string | URL, payload: T) {
  const body: P = await jsonFetcher(url, payload);
  return body;
}

export async function finishRestore<
  T extends Omit<RestoreSessionSetupInput, 'userId'>,
  P extends SessionSetupServerOutput,
>(url: string | URL, payload: T) {
  const body: P = await jsonFetcher(url, payload);
  return body;
}

export async function finishReset<
  T extends Omit<ResetSessionSetupInput, 'userId'>,
  P extends SessionSetupServerOutput,
>(url: string | URL, payload: T) {
  const body: P = await jsonFetcher(url, payload);
  return body;
}
