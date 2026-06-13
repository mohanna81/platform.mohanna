/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media', // Enable automatic dark mode based on system preference
  theme: {
    extend: {
      colors: {
        'brand-bg': '#0b1320', // Card background
        'brand-peach': '#FBBF77', // Button and accent
        'brand-peach-dark': '#f9b15c',
        'brand-blue': '#b6c6e3', // Subtext
        'brand-input': '#10192b',
        'brand-border': '#232e47',
        'brand-gradient-from': '#eaf3f7',
        'brand-gradient-to': '#fdf3e7',
      },
      borderRadius: {
        'xl': '16px',
      },
      boxShadow: {
        'brand': '0 4px 32px 0 rgba(11, 19, 32, 0.10)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
      },
    },
    fontFamily: {
      sans: ['var(--font-geist-sans)', 'sans-serif'],
      mono: ['var(--font-geist-mono)', 'monospace'],
    },
    screens: {
      'xs': '400px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
  plugins: [],
};
