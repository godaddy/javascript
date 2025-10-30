import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  plugins: [],
  tsconfig: './tsconfig.json',
  dts: true,
});
