import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  tsconfig: './tsconfig.json',
  dts: true,
  external: [/^react($|\/)/, /^react-native($|\/)/, /^react-native-webview($|\/)/],
});
