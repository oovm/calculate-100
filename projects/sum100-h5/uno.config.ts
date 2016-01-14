import {defineConfig, presetIcons, presetUno} from 'unocss'

export default defineConfig({
    presets: [
        presetUno(),
        presetIcons({
            collections: {
                carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
                mdi: () => import('@iconify-json/mdi/icons.json').then(i => i.default),
            }
        })
    ],
    theme: {
        colors: {
            primary: {
                50: '#eff6ff',
                100: '#dbeafe',
                200: '#bfdbfe',
                300: '#93c5fd',
                400: '#60a5fa',
                500: '#3b82f6',
                600: '#2563eb',
                700: '#1d4ed8',
                800: '#1e40af',
                900: '#1e3a8a'
            }
        }
    },
    shortcuts: {
        'btn': 'px-4 py-2 rounded-lg font-medium transition-colors duration-200',
        'btn-primary': 'btn bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
        'btn-secondary': 'btn bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400',
        'input-field': 'px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'card': 'bg-white rounded-xl shadow-sm border border-gray-200 p-6'
    }
})