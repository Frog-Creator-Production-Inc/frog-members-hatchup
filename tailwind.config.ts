/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
	  './pages/**/*.{js,ts,jsx,tsx,mdx}',
	  './components/**/*.{js,ts,jsx,tsx,mdx}',
	  './app/**/*.{js,ts,jsx,tsx,mdx}',
	  './src/**/*.{js,ts,jsx,tsx,mdx}',
	  './lib/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
	  container: {
		center: true,
		padding: "2rem",
		screens: {
		  "2xl": "1400px",
		},
	  },
	  extend: {
		colors: {
		  border: "hsl(var(--border))",
		  input: "hsl(var(--input))",
		  ring: "hsl(var(--ring))",
		  background: "hsl(var(--background))",
		  foreground: "hsl(var(--foreground))",
		  primary: {
			DEFAULT: "#4FD1C5",
			foreground: "#FFFFFF",
		  },
		  secondary: {
			DEFAULT: "#38B2AC",
			foreground: "#FFFFFF",
		  },
		  select: {
			DEFAULT: "white",
		  },
		  muted: {
			DEFAULT: "hsl(var(--muted))",
			foreground: "hsl(var(--muted-foreground))",
		  },
		  accent: {
			DEFAULT: "hsl(var(--accent))",
			foreground: "hsl(var(--accent-foreground))",
		  },
		  card: {
			DEFAULT: "hsl(var(--card))",
			foreground: "hsl(var(--card-foreground))",
		  },
		},
		borderRadius: {
		  lg: "0.5rem",
		  md: "calc(0.5rem - 2px)",
		  sm: "calc(0.5rem - 4px)",
		},
		typography: {
		  DEFAULT: {
			css: {
			  color: '#333',
			  maxWidth: '100%',
			  lineHeight: '1.8',
			  p: {
				marginTop: '1.25em',
				marginBottom: '1.25em',
			  },
			  a: {
				color: '#4FD1C5',
				'&:hover': {
				  color: '#38B2AC',
				},
				textDecoration: 'none',
			  },
			  h1: {
				color: '#1a202c',
				fontWeight: '700',
				fontSize: '2.5em',
				marginTop: '1.5em',
				marginBottom: '0.75em',
				lineHeight: '1.3',
			  },
			  h2: {
				color: '#1a202c',
				fontWeight: '700',
				fontSize: '2em',
				marginTop: '1.25em',
				marginBottom: '0.625em',
				lineHeight: '1.3',
			  },
			  h3: {
				color: '#1a202c',
				fontWeight: '600',
				fontSize: '1.5em',
				marginTop: '1em',
				marginBottom: '0.5em',
				lineHeight: '1.4',
			  },
			  h4: {
				color: '#1a202c',
				fontWeight: '600',
				fontSize: '1.25em',
				marginTop: '0.75em',
				marginBottom: '0.375em',
				lineHeight: '1.4',
			  },
			  blockquote: {
				borderLeftColor: '#4FD1C5',
				borderLeftWidth: '4px',
				fontStyle: 'italic',
				paddingLeft: '1.5em',
				backgroundColor: '#f7fafc',
				borderRadius: '0.25rem',
				padding: '1em',
			  },
			  'code::before': {
				content: '""',
			  },
			  'code::after': {
				content: '""',
			  },
			  ul: {
				marginTop: '1.25em',
				marginBottom: '1.25em',
			  },
			  ol: {
				marginTop: '1.25em',
				marginBottom: '1.25em',
			  },
			  li: {
				marginBottom: '0.75em',
				lineHeight: '1.7',
			  },
			  'li > p': {
				marginTop: '0.25em',
				marginBottom: '0.25em',
			  },
			  img: {
				marginTop: '1.5em',
				marginBottom: '1.5em',
				borderRadius: '0.375rem',
			  },
			},
		  },
		},
	  },
	},
	plugins: [
	  require("tailwindcss-animate"),
	  require('@tailwindcss/typography'),
	],
  }
  