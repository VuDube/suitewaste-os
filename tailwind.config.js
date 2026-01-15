/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		screens: {
  			xs: '320px',
  			sm: '428px',
  			md: '768px',
  			lg: '1024px',
  			xl: '1280px'
  		},
  		fontFamily: {
  			sans: ['Inter', 'sans-serif'],
  			mono: ['JetBrains Mono', 'monospace'],
  			display: ['Inter', 'sans-serif']
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: '#2E5A35',
  				foreground: '#FFFFFF'
  			},
  			leaf: {
  				DEFAULT: '#4CAF50',
  				foreground: '#FFFFFF'
  			},
  			surface: {
  				container: 'hsl(var(--surface-container))',
  				variant: 'hsl(var(--surface-variant))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			}
  		},
  		boxShadow: {
  			'elevation-1': '0 1px 3px rgba(0,0,0,0.12)',
  			'elevation-4': '0 4px 10px rgba(46, 90, 53, 0.15)',
  			'elevation-12': '0 12px 24px rgba(46, 90, 53, 0.25)',
  			'leaf-glow': '0 0 20px -5px #4CAF50',
  			glow: '0 0 20px -5px #2E5A35'
  		},
  		transitionTimingFunction: {
  			'm3-standard': 'cubic-bezier(0.2, 0, 0, 1)'
  		},
  		animation: {
  			'fade-in': 'fade-in 0.4s cubic-bezier(0.2, 0, 0, 1)',
  			'scale-in': 'scale-in 0.3s cubic-bezier(0.2, 0, 0, 1)',
  			'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'load': 'load 2s cubic-bezier(0.2, 0, 0, 1) infinite'
  		},
  		keyframes: {
  			'fade-in': {
  				'0%': { opacity: '0', transform: 'translateY(10px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			'scale-in': {
  				'0%': { opacity: '0', transform: 'scale(0.95)' },
  				'100%': { opacity: '1', transform: 'scale(1)' }
  			},
  			'load': {
  				'0%': { transform: 'translateX(-100%)' },
  				'100%': { transform: 'translateX(100%)' }
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")]
}