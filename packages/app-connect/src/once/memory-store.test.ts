import { describe } from 'vitest';
import { createMemoryOnceStore } from './memory-store';
import { onceStoreContract } from './store-contract.test-helper';

describe('memory once store', () => {
  onceStoreContract((now) => createMemoryOnceStore({ now }));
});
