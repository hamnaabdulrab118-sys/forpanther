export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.4s ease-out forwards',
        'slideUp': 'slideUp 0.5s ease-out forwards',
        'shooting': 'shooting 2.5s ease-out infinite',
        'bounceDot': 'bounceDot 1s ease-in-out infinite',
        'pulseGlow': 'pulseGlow 2.5s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        twinkle: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.1' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(28px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shooting: { '0%': { transform: 'translate(0,0)', opacity: '1' }, '100%': { transform: 'translate(500px,250px)', opacity: '0' } },
        bounceDot: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 10px rgba(233,195,73,0.3)' }, '50%': { boxShadow: '0 0 30px rgba(233,195,73,0.8)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '20%,60%': { transform: 'translateX(-8px)' }, '40%,80%': { transform: 'translateX(8px)' } },
      },
    },
  },
  plugins: [],
}
