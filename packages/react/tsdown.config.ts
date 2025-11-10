import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { defineConfig } from 'tsdown';

const execAsync = promisify(exec);

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  plugins: [],
  tsconfig: './tsconfig.json',
  dts: true,
  external: [/^react($|\/)/, /^react-dom($|\/)/],
  onSuccess: async () => {
    // biome-ignore lint/suspicious/noConsole: check build status
    console.log('Transpiling CSS...');

    const start = Date.now();
    await execAsync(
      'pnpm dlx @tailwindcss/cli -i ./src/globals.css -o ./dist/index.css --minify'
    );

    // biome-ignore lint/suspicious/noConsole:  check build status timing
    console.log(`Transpiled CSS in ${Date.now() - start}ms`);
  },
});
