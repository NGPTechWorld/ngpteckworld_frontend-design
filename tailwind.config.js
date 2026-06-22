/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        deep: '#1A0F26',
        primary: '#301D3D',
        accent: '#6B4E8E',
        'accent-hover': '#8160A8',
        'accent-light': '#9678BE',
        'accent-lighter': '#C5B2E0',
        ink: '#F3EEF8',
        muted: '#B5A6C7',
        faint: '#897A9E',
        soft: '#C9BCD9',
      },
      fontFamily: {
        cairo: ["'Cairo'", 'sans-serif'],
        poppins: ["'Poppins'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      maxWidth: { site: '1200px', narrow: '1040px' },
      borderRadius: { card: '18px', panel: '24px' },
      boxShadow: {
        cardhover: '0 24px 50px -24px rgba(107,78,142,.55)',
        btnhover: '0 14px 30px -10px rgba(107,78,142,.7)',
      },
    },
  },
  plugins: [],
}
