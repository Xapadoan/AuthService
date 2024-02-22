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
