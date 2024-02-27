import { handleResponse } from 'shared/src/lib/http';

describe('Handle Response', () => {
  it('should throw when response is not ok', async () => {
    try {
      const res = new Response(JSON.stringify({ error: 'Intentional Error' }), {
        status: 500,
      });
      expect(res.ok).toBeFalsy();
      await handleResponse(res);
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error).toBeTruthy();
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('500');
      expect((error as Error).message).toContain('Intentional Error');
    }
  });

  it('should still throw when response is not parsable as json', async () => {
    try {
      const res = new Response('Not a json response', {
        status: 500,
      });
      expect(res.ok).toBeFalsy();
      await handleResponse(res);
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error).toBeTruthy();
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('500');
    }
  });

  it('should return response as parsed JSON', async () => {
    const res = new Response(JSON.stringify({ key: 'value' }), {
      status: 200,
    });
    expect(res.ok).toBeTruthy();
    const handled = await handleResponse(res);
    expect(typeof handled).toEqual('object');
    expect(handled).toMatchObject({ key: 'value' });
  });
});
