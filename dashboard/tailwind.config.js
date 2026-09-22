/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // brand (same values as the public site)
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
        gold: '#C9A86A',
        'gold-light': '#E2C88F',
        // dashboard surfaces
        surface: '#22142F',
        raised: '#2C1B3E',
        // semantic (tuned for the dark purple background)
        success: '#5FD3A0',
        danger: '#F2727D',
        warning: '#E4B75C',
        info: '#7FB2F0',
      },
      fontFamily: {
        cairo: ["'Cairo'", 'sans-serif'],
        poppins: ["'Poppins'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      borderRadius: { card: '18px', panel: '24px' },
      boxShadow: {
        card: '0 18px 40px -28px rgba(0,0,0,.6)',
        pop: '0 24px 60px -20px rgba(0,0,0,.75)',
        cardhover: '0 24px 50px -24px rgba(107,78,142,.55)',
        btnhover: '0 14px 30px -10px rgba(107,78,142,.7)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(8px) scale(.98)' }, to: { opacity: '1', transform: 'none' } },
        'toast-in': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        'drawer-in': { from: { opacity: '0', transform: 'scale(.96)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in .15s ease-out',
        'pop-in': 'pop-in .18s cubic-bezier(.2,.7,.2,1)',
        'toast-in': 'toast-in .22s cubic-bezier(.2,.7,.2,1)',
        'drawer-in': 'drawer-in .18s ease-out',
      },
    },
  },
  plugins: [],
}
