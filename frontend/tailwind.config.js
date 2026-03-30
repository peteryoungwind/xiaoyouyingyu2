/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  safelist: [
    { pattern: /^bg-(blue|green|purple|yellow|red|pink|indigo|orange|teal|amber|lime|cyan|rose|violet|sky|emerald|fuchsia)-100$/ },
    { pattern: /^text-(blue|green|purple|yellow|red|pink|indigo|orange|teal|amber|lime|cyan|rose|violet|sky|emerald|fuchsia)-700$/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'SF Pro Display', 'Inter', 'sans-serif'],
      },
      colors: {
        background: '#F5F5F7',
        card: '#FFFFFF',
      },
      borderRadius: {
        apple: '12px',
        'apple-lg': '16px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
