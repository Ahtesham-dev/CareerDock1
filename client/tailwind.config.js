module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        surface: { base: '#0A0A0A', raised: '#111111', overlay: '#171717', hover: '#202020' },
        card: { DEFAULT: '#1A1A1A', hover: '#202020', border: 'rgba(255,255,255,0.08)' },
        accent: { DEFAULT: '#4F46E5', hover: '#6366F1', light: '#818CF8', lighter: '#A5B4FC' },
        text: { primary: '#FFFFFF', secondary: '#B0B0B0', muted: '#7A7A7A' },
        success: '#10B981', warning: '#F59E0B', error: '#EF4444'
      },
      boxShadow: {
        'premium': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'premium-lg': '0 4px 24px rgba(0,0,0,0.5), 0 1px 8px rgba(0,0,0,0.4)',
        'premium-xl': '0 8px 40px rgba(0,0,0,0.6)',
        'glow': '0 0 24px rgba(79,70,229,0.25)',
        'glow-lg': '0 0 48px rgba(79,70,229,0.3)',
        'card': '0 2px 12px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5)'
      },
      borderRadius: { 'premium': '12px', 'premium-lg': '16px', 'premium-xl': '20px' },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseSubtle: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } }
      }
    }
  },
  plugins: []
};
