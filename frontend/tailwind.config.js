/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0EA5C9',
          hover: '#0891B2',
          muted: '#D6F4FF',
          deep: '#0B4A5C',
          darker: '#042A3A',
        },
        secondary: {
          DEFAULT: '#2EE6D6',
          hover: '#1AD4C4',
          muted: '#CFFCF7',
        },
        sky: {
          DEFAULT: '#5EC8F5',
          soft: '#E8F7FF',
          mist: '#F3FBFF',
        },
        line: '#5A8FA8',
        soft: '#F3FBFF',
        slate: {
          DEFAULT: '#334E5A',
        },
        charcoal: '#042A3A',
      },
      fontFamily: {
        heading: ['Syne', 'system-ui', 'sans-serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'aqua-gradient':
          'linear-gradient(135deg, #7DD3FC 0%, #2EE6D6 48%, #0EA5C9 100%)',
        'gold-gradient':
          'linear-gradient(135deg, #7DD3FC 0%, #2EE6D6 48%, #0EA5C9 100%)',
        'amber-gradient':
          'linear-gradient(135deg, #7DD3FC 0%, #2EE6D6 48%, #0EA5C9 100%)',
        'horizon-radial':
          'radial-gradient(ellipse at 20% 0%, #1AD4C4 0%, #0B4A5C 42%, #042A3A 100%)',
        'radial-gradient': 'radial-gradient(circle, var(--tw-gradient-stops))',
        'teal-radial':
          'radial-gradient(ellipse at center, #14B8C8 0%, #0B4A5C 55%, #042A3A 100%)',
      },
      boxShadow: {
        card: '0 24px 60px -18px rgba(4, 42, 58, 0.28)',
        glow: '0 12px 40px -12px rgba(46, 230, 214, 0.45)',
      },
      borderRadius: {
        lg: '0.75rem',
      },
    },
  },
  plugins: [],
}
