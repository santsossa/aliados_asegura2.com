/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			brand: {
  				DEFAULT: '#2D2A7A',
  				light: '#EEEDF8',
  				dark: '#201D5F'
  			},
  			accent: {
  				DEFAULT: '#F5A623',
  				light: '#FEF3DC',
  				dark: '#E09410'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		boxShadow: {
  			card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  			lg: '0 4px 24px rgba(45,42,122,0.10)'
  		}
  	}
  },
  plugins: [],
}
