export function expectResolvedValueMatch(
  spy: jest.SpyInstance,
  expected: object
) {
  return expect(spy.mock.results[0]?.value).resolves.toMatchObject(expected);
}

export function expectResolvedValueEqual(
  spy: jest.SpyInstance,
  expected: unknown
) {
  return expect(spy.mock.results[0]?.value).resolves.toEqual(expected);
}

export const validUser = {
  id: 1,
  cardId: 'pending',
  email: 'email',
  registerWebhook: 'register',
  restoreWebhook: 'restore',
};

export const validIntegration = {
  id: 1,
  apiKey: 'apiKey-1',
  registerWebhook: 'register-1',
  restoreWebhook: 'restore-1',
  resetConfirmationWebhook: 'reset-confirmation-1',
  resetCredentialsWebhook: 'reset-credentials-1',
};
