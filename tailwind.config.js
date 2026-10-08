/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#14213d',
        navy: '#132445',
        blue: '#3559d8',
        canvas: '#f5f7fb',
      },
      boxShadow: {
        card: '0 2px 12px rgba(29, 49, 86, .045)',
      },
    },
  },
  plugins: [],
}
