/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'blue-950': '#0A1128',
        'blue-900': '#001F54',
        'red-500': '#FB3010',
        'yellow-300': '#FFD60A',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      // Enhanced font sizes for better cross-platform scaling
      fontSize: {
        'xs': ['0.7rem', { lineHeight: '1rem' }],
        'sm': ['0.8rem', { lineHeight: '1.2rem' }], 
        'base': ['0.9rem', { lineHeight: '1.4rem' }],
        'lg': ['1rem', { lineHeight: '1.5rem' }],
        'xl': ['1.1rem', { lineHeight: '1.6rem' }],
        '2xl': ['1.2rem', { lineHeight: '1.7rem' }],
        // Fluid responsive text
        'fluid-xs': 'clamp(0.65rem, 1.5vw, 0.75rem)',
        'fluid-sm': 'clamp(0.75rem, 1.8vw, 0.875rem)', 
        'fluid-base': 'clamp(0.85rem, 2vw, 1rem)',
        'fluid-lg': 'clamp(0.95rem, 2.2vw, 1.125rem)',
      },
      
      // Tighter spacing scale
      spacing: {
        '0.5': '0.125rem',
        '1': '0.25rem',
        '1.5': '0.375rem',
        '2': '0.5rem',
        '2.5': '0.625rem',
        '3': '0.75rem',
        '3.5': '0.875rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        // Compact variants for dense layouts
        'compact-1': 'clamp(0.2rem, 0.5vw, 0.25rem)',
        'compact-2': 'clamp(0.35rem, 0.8vw, 0.5rem)',
        'compact-3': 'clamp(0.5rem, 1vw, 0.75rem)',
        'compact-4': 'clamp(0.75rem, 1.5vw, 1rem)',
      },

      // Better breakpoints for different screen densities  
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px', 
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Density-based breakpoints
        'compact': { 'raw': '(max-width: 1024px) and (min-resolution: 120dpi)' },
        'high-density': { 'raw': '(-webkit-min-device-pixel-ratio: 1.5)' },
      },

      animation: {
        float: 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(5px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },

      // Compact component sizes
      height: {
        'btn-sm': 'clamp(32px, 8vw, 36px)',
        'btn-md': 'clamp(36px, 9vw, 44px)',
        'input-sm': 'clamp(36px, 8vw, 40px)',
        'header': 'clamp(60px, 12vw, 72px)',
      },

      minHeight: {
        'touch': '44px',
        'btn': 'clamp(36px, 8vw, 44px)',
      },

      // Enhanced border radius for compact designs
      borderRadius: {
        'compact': '0.375rem',
        'card': '0.5rem',
      },
    },
  },
  plugins: [
    // Custom plugin for responsive utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Compact button styling
        '.btn-compact': {
          minHeight: theme('height.btn-sm'),
          padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
          fontSize: theme('fontSize.fluid-sm')[0],
          lineHeight: theme('fontSize.fluid-sm')[1].lineHeight,
        },
        
        // Compact input styling  
        '.input-compact': {
          height: theme('height.input-sm'),
          padding: 'clamp(0.5rem, 1.2vw, 0.75rem)',
          fontSize: theme('fontSize.fluid-sm')[0],
        },
        
        // Compact card styling
        '.card-compact': {
          padding: 'clamp(0.75rem, 2vw, 1.25rem)',
          borderRadius: theme('borderRadius.card'),
        },
        
        // Responsive text that scales well
        '.text-responsive': {
          fontSize: theme('fontSize.fluid-base')[0],
          lineHeight: theme('fontSize.fluid-base')[1].lineHeight,
        },
        
        // High density screen adjustments
        '@media (-webkit-min-device-pixel-ratio: 1.5)': {
          '.high-dpi-adjust': {
            fontSize: '0.9em',
            padding: '0.8em',
          }
        },
        
        // Compact spacing for dense layouts
        '.space-compact > * + *': {
          marginTop: theme('spacing.compact-3'),
        },
        
        '.gap-compact': {
          gap: theme('spacing.compact-2'),
        },
      }
      
      addUtilities(newUtilities)
    }
  ],
};