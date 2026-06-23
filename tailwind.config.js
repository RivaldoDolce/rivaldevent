/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sand: '#F7F4ED',
        ivory: '#F0EBE3',
        terracotta: '#B84A32',
        gold: '#C9A84C',
        forest: '#1A4D2E',
        indigo: '#2C3E5A',
        mango: '#E8A838',
        onyx: '#1A1816',
        stone: '#6B6560',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      fontFamily: {
        serif: ['PlayfairDisplay-Regular', 'PlayfairDisplay-Bold'],
        sans: ['Inter-Regular', 'Inter-Bold', 'Inter-Light'],
      },
    },
  },
  plugins: [],
};