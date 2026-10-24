/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          slate: '#6A89A7',
          ice: '#BDDDFC',
          sky: '#88BDF2',
          deep: '#384959',
        },
        surface: {
          main: '#101923',
          secondary: '#182532',
          elevated: '#223344',
          card: '#1B2A38',
          border: '#34495D',
        },
        content: {
          primary: '#F3F7FB',
          secondary: '#A9BACB',
          muted: '#72889E',
        },
        emergency: {
          red: '#FF5B61',
          amber: '#F4B860',
          green: '#55C99A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-sky': '0 0 20px -3px rgba(136, 189, 242, 0.35)',
        'glow-red': '0 0 20px -3px rgba(255, 91, 97, 0.45)',
        'glow-green': '0 0 20px -3px rgba(85, 201, 154, 0.35)',
      },
    },
  },
  plugins: [],
}
