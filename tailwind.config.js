/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,html}'],
  theme: {
    extend: {
      colors: {
        // oklch色空間を使用（PRINCIPLES.mdに従う）
        primary: 'oklch(0.7 0.15 240)',
        secondary: 'oklch(0.6 0.12 180)',
        accent: 'oklch(0.8 0.18 60)',
        background: 'oklch(0.98 0 0)',
        surface: 'oklch(0.95 0 0)',
        text: 'oklch(0.2 0 0)',
        'text-secondary': 'oklch(0.5 0 0)',
      },
      screens: {
        mobile: { max: '767px' },
        desktop: '768px',
      },
    },
  },
  plugins: [],
};
