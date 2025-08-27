/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				// Apple-style blue theme using CSS variables
				'apple-blue': {
					DEFAULT: 'var(--apple-blue)',
					dark: 'var(--apple-blue-dark)',
					light: 'var(--apple-blue-light)',
					bg: 'var(--apple-blue-bg)',
					subtle: 'var(--apple-blue-subtle)',
					secondary: 'var(--apple-blue-secondary)',
					100: 'var(--apple-blue-100)',
					200: 'var(--apple-blue-200)',
					300: 'var(--apple-blue-300)',
					400: 'var(--apple-blue-400)',
					500: 'var(--apple-blue-500)',
					600: 'var(--apple-blue-600)',
					700: 'var(--apple-blue-700)',
					800: 'var(--apple-blue-800)',
					900: 'var(--apple-blue-900)',
				},
				'apple-gray': {
					DEFAULT: 'var(--apple-gray)',
					light: 'var(--apple-gray-light)',
				},
				'apple-white': 'var(--apple-white)',
				'apple-success': 'var(--apple-success)',
				'apple-warning': 'var(--apple-warning)',
				'apple-error': 'var(--apple-error)',
				'apple-info': 'var(--apple-info)',
				'text-primary': 'var(--apple-text-primary)',
				'text-secondary': 'var(--apple-text-secondary)',
				'text-tertiary': 'var(--apple-text-tertiary)',
				'border-light': '#D2D2D7',
				'card-bg': 'var(--apple-white)',
				primary: {
					DEFAULT: 'var(--apple-blue)',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'var(--apple-text-secondary)',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				accent: {
					DEFAULT: 'var(--apple-blue)',
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}