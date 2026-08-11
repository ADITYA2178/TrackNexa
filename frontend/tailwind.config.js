/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D9488',
          hover: '#0F766E',
          muted: '#CCFBF1',
          deep: '#0A6B63',
          darker: '#085F58',
        },
        secondary: {
          DEFAULT: '#D4AF37',
          hover: '#B8941F',
          muted: '#FEF3C7',
        },
        soft: '#F9FAFB',
        slate: {
          DEFAULT: '#4B5563',
        },
        charcoal: '#111827',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient':
          'linear-gradient(135deg, #FDE08B 0%, #D4AF37 50%, #997A15 100%)',
        'amber-gradient':
          'linear-gradient(135deg, #FDE08B 0%, #D4AF37 50%, #997A15 100%)',
        'radial-gradient': 'radial-gradient(circle, var(--tw-gradient-stops))',
        'teal-radial':
          'radial-gradient(ellipse at center, #0D9488 0%, #0F766E 55%, #0A5C56 100%)',
      },
      boxShadow: {
        card: '0 20px 50px -12px rgba(0, 0, 0, 0.35)',
      },
      borderRadius: {
        lg: '0.5rem',
      },
    },
  },
  plugins: [],
}
