import {defineConfig} from 'vite';

export default defineConfig({
    build: {
        target: 'es2020',
        lib: {
            entry: 'src/index.ts',
            name: 'Puzzle100',
            fileName: (format) => `puzzle100.${format}.js`,
        },
        rollupOptions: {
            output: {
                exports: 'named'
            }
        }
    },
    plugins: [],
});