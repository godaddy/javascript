import { describe, expect, it, vi } from 'vitest';
import { UpstreamError } from './lib/commerce/errors';
import { fetchUpstream, readUpstreamJson, upstreamStatusError } from './lib/commerce/upstream-http';

const request = { operation: 'Test call', details: { endpoint: 'https://api.example.test/v1/thing' } };

describe('upstream HTTP handling', () => {
  it('reports a network failure with the request details', async () => {
    const cause = new TypeError('fetch failed');
    const error = await fetchUpstream('https://api.example.test/v1/thing', {}, request, async () => {
      throw cause;
    }).catch((thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(UpstreamError);
    expect(error).toMatchObject({
      code: 'upstream_error',
      message: 'Test call could not reach Commerce',
      details: request.details,
      cause,
    });
  });

  it('reports a non-JSON body with the upstream status', async () => {
    const error = await readUpstreamJson(new Response('<html>', { status: 200 }), request).catch(
      (thrown: unknown) => thrown,
    );
    expect(error).toMatchObject({
      code: 'upstream_error',
      message: 'Test call returned a non-JSON response',
      details: { ...request.details, upstreamStatus: 200 },
    });
  });

  it.each([401, 403])('reports %i as upstream_unauthorized', async (status) => {
    const error = await upstreamStatusError(new Response(null, { status }), request);
    expect(error).toMatchObject({
      code: 'upstream_unauthorized',
      details: { ...request.details, upstreamStatus: status },
    });
  });

  it('keeps other statuses as upstream_error unless the caller has evidence', async () => {
    expect(await upstreamStatusError(new Response(null, { status: 400 }), request)).toMatchObject({
      code: 'upstream_error',
    });
    expect(
      await upstreamStatusError(new Response(null, { status: 400 }), request, { unauthorized: true }),
    ).toMatchObject({ code: 'upstream_unauthorized' });
  });

  it('releases an unread body and leaves a read one alone', async () => {
    const unread = new Response('detail', { status: 500 });
    const cancel = vi.spyOn(unread.body as ReadableStream, 'cancel');
    await upstreamStatusError(unread, request);
    expect(cancel).toHaveBeenCalled();

    const read = new Response('{}', { status: 404 });
    await read.json();
    await expect(upstreamStatusError(read, request)).resolves.toBeInstanceOf(UpstreamError);
  });
});
