/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mauve: {
          50: '#faf8ff',
          100: '#f3f0ff',
          200: '#ede9fe',
          300: '#ddd6fe',
          400: '#c4b5fd',
          500: '#a78bfa',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        olive: {
          50: '#fafaf9',
          100: '#f4f4f1',
          200: '#e7e5e0',
          300: '#d3cec3',
          400: '#a19b8c',
          500: '#78716b',
          600: '#57534e',
          700: '#44403c',
          800: '#292824',
          900: '#1c1917',
        },
      },
      backgroundColor: {
        DEFAULT: '#faf8ff', // mauve-50
      },
    },
  },
  plugins: [],
}
