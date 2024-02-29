const mockFetchJson = jest.fn();
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: mockFetchJson,
});
global.fetch = mockFetch;

import { detectCardId } from '@lib/detectCardId';

describe('Detect Card Id', () => {
  it('should return an id when all is well', async () => {
    mockFetchJson.mockResolvedValueOnce('???');
    const result = await detectCardId('imageAsBase64');
    expect(result).toMatchObject({ success: true, id: 123 });
  });
});
