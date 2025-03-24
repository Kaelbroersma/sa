/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0A0A0A',
        secondary: '#121212',
        gunmetal: {
          light: '#3A444A',
          DEFAULT: '#1E2529',
          dark: '#131A1F'
        },
        tan: {
          light: '#D2C6A8',
          DEFAULT: '#BEA987',
          dark: '#8C7A5B'
        },
        crimson: '#DC143C',
        'dark-gray': '#1A1A1A',
        'medium-gray': '#222222'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Nippo-Variable', 'Nippo-Regular', 'sans-serif'],
        logo: ['Montserrat', 'sans-serif']
      },
      boxShadow: {
        'sharp': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        'luxury': '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
      },
      zIndex: {
        '5': '5',
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-sm': {
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-md': {
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-lg': {
          textShadow: '3px 3px 6px rgba(0, 0, 0, 0.7)',
        },
        '.text-shadow-none': {
          textShadow: 'none',
        },
      };

      addUtilities(newUtilities, ['responsive', 'hover']);
    },
  ],
};