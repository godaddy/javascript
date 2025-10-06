import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/express/index.ts',
    'src/next/index.ts',
    'src/tanstack/index.ts'
  ],
  plugins: [],
  tsconfig: './tsconfig.json',
  dts: true
})
