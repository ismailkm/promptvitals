/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		fontFamily: {
  			mono: [
  				'JetBrains Mono',
  				'monospace'
  			],
  			sans: [
  				'JetBrains Mono',
  				'monospace'
  			]
  		},
  		colors: {
  			// Modern dark theme with better contrast
  			slate: {
  				'50': '#f8fafc',
  				'100': '#f1f5f9',
  				'200': '#e2e8f0',
  				'300': '#cbd5e1',
  				'400': '#94a3b8',
  				'500': '#64748b',
  				'600': '#475569',
  				'700': '#334155',
  				'800': '#1e293b',
  				'850': '#172033',
  				'900': '#0f172a',
  				'950': '#020617'
  			},
  			// Vibrant accent colors with good contrast
  			electric: {
  				blue: '#3b82f6',    // Bright blue
  				purple: '#8b5cf6',  // Vivid purple  
  				pink: '#ec4899',    // Hot pink
  				green: '#10b981',   // Emerald green
  				yellow: '#f59e0b',  // Amber
  				red: '#ef4444',     // Red
  				cyan: '#06b6d4'     // Cyan
  			},
  			// Success/Warning/Error with good contrast
  			status: {
  				success: '#22c55e',
  				warning: '#f59e0b', 
  				error: '#ef4444',
  				info: '#3b82f6'
  			},
  			// Legacy cyber colors (keeping for compatibility)
  			neon: {
  				blue: '#00fff5',
  				purple: '#bf00ff',
  				pink: '#ff00ff'
  			},
  			cyber: {
  				black: '#000000',
  				dark: '#0a0a0a',
  				gray: '#121212',
  				light: '#1a1a1a'
  			},
  			terminal: {
  				green: '#00ff00',
  				yellow: '#ffff00',
  				red: '#ff0000'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-in-out',
  			'slide-up': 'slideUp 0.5s ease-out',
  			glow: 'glow 2s ease-in-out infinite alternate'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(20px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			glow: {
  				'0%': {
  					textShadow: '0 0 10px #00fff5, 0 0 20px #00fff5'
  				},
  				'100%': {
  					textShadow: '0 0 20px #bf00ff, 0 0 30px #bf00ff'
  				}
  			}
  		},
  		backgroundImage: {
  			'cyber-grid': 'linear-gradient(0deg, transparent 24%, rgba(0, 255, 245, .05) 25%, rgba(0, 255, 245, .05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 245, .05) 75%, rgba(0, 255, 245, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 245, .05) 25%, rgba(0, 255, 245, .05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 245, .05) 75%, rgba(0, 255, 245, .05) 76%, transparent 77%, transparent)'
  		},
  		backgroundSize: {
  			cyber: '50px 50px'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};