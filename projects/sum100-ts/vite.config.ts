import {defineConfig} from 'vite';

export default defineConfig({
    build: {
        target: 'es2020',
        lib: {
            entry: 'src/index.ts',
            name: 'Sum100TS',
            fileName: (format) => `sum100-ts.${format}.js`,
        },
        rollupOptions: {
            output: {
                exports: 'named'
            }
        }
    },
    plugins: [],
    test: {
        environment: 'jsdom'
    }
});