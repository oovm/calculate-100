import {defineConfig} from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'Sum100TS',
            fileName: (format) => `sum100-ts.${format}.js`,
        },
    },
    plugins: [],
    test: {
        environment: 'jsdom'
    }
});