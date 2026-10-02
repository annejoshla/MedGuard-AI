export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0B1F3A', 800: '#12294A', 700: '#1B3760' },
        teal: { 50: '#E8F8F7', 100: '#C9EFEC', 500: '#0FA3A3', 600: '#0B8A8A', 700: '#0A7070' },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(11,31,58,.05), 0 6px 20px -8px rgba(11,31,58,.10)' },
    },
  },
  plugins: [],
};
