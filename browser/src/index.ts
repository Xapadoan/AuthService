import {
  RegisterInitServerOutput,
  RegisterUploadServiceInput,
  RegisterUploadServiceOutput,
  handleResponse,
} from 'shared';

export async function initRegister(input: string | URL, email: string) {
  const body: RegisterInitServerOutput = await fetch(input, {
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
  console.log('Lenght: ', body.length / 1024);
  await fetch(input, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  }).then((res) => handleResponse<RegisterUploadServiceOutput>(res));
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
