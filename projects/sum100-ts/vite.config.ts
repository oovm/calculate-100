import {defineConfig} from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'TspArt',
            fileName: (format) => `tsp-art.${format}.js`,
        },
    },
    plugins: [],

});