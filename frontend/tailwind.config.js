/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色调 - 橙色霓虹（避免蓝紫渐变）
        primary: {
          DEFAULT: '#ff6b35',
          hover: '#ff8c5a',
          light: '#ff9f6b',
          dark: '#e55a2b'
        },
        // 强调色 - 青色
        accent: {
          DEFAULT: '#00e5cc',
          hover: '#00ffdf',
          light: '#4dfff0',
          dark: '#00b8a3'
        },
        // 背景色 - 深色系
        dark: {
          DEFAULT: '#0a0a0f',
          card: '#12121a',
          hover: '#1a1a25',
          border: '#2a2a35'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', 'Source Code Pro', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #ff6b35, 0 0 10px #ff6b35' },
          '100%': { boxShadow: '0 0 10px #ff6b35, 0 0 20px #ff6b35, 0 0 30px #ff6b35' }
        }
      }
    },
  },
  plugins: [],
}
