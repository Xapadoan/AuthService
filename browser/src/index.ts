import { RegisterInitServerOutput, handleResponse } from 'shared';

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
