import { useState } from 'react';
import { useSearchParams } from 'react-router';

/**
 * A root's search params: the page URL's, or with `urlState` off, the root's own. A second root on the page, such
 * as a quick view, then neither reads nor changes the page's params, and its state ends when it unmounts.
 */
export function useRootParams(urlState: boolean): [URLSearchParams, (next: URLSearchParams) => void] {
  const [urlParams, setUrlParams] = useSearchParams();
  const [localParams, setLocalParams] = useState<URLSearchParams>(() => new URLSearchParams());
  return urlState ? [urlParams, setUrlParams] : [localParams, setLocalParams];
}
