export function expectResolved(spy: jest.SpyInstance) {
  return expect(spy.mock.results[0]?.value).resolves;
}

export function expectNthResolved(spy: jest.SpyInstance, n: number) {
  return expect(spy.mock.results[n - 1]?.value).resolves;
}

export const validUser = {
  id: 1,
  cardId: 'pending',
  email: 'email',
};

export const validIntegration = {
  id: 1,
  apiKey: 'apiKey-1',
  registerWebhook: 'register-1',
  restoreWebhook: 'restore-1',
  resetConfirmationWebhook: 'reset-confirmation-1',
  resetCredentialsWebhook: 'reset-credentials-1',
  resetUploadPage: 'reset-page-1',
};

export const validUserJoinIntegration = {
  ...validIntegration,
  ...validUser,
};
