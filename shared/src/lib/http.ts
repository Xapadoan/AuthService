export type HTTPError = {
  error: string;
};

export async function handleResponse<T>(res: Response) {
  if (res.ok) {
    const body: T = await res.json();
    return body;
  }
  console.error(res.status, res.statusText);
  const errorBody: HTTPError = await res.json().catch(() => {
    throw new Error(`${res.status} - ${res.statusText}`);
  });
  console.error('HTTPError: ', errorBody.error);
  throw new Error(`${res.status} - ${errorBody.error}`);
}
