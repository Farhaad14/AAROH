import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          dark: '#0b0713',     // Solid, deep-plum background canvas
          panel: 'rgba(21, 11, 38, 0.55)', // Semi-transparent deep plum for glass panels
        },
        neon: {
          pink: '#ff1493',     // Deep hot pink / fuchsia accent
          fuchsia: '#d946ef',  // Vibrant fuchsia
          purple: '#a855f7',   // Electric amethyst
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      boxShadow: {
        'fuchsia-glow': '0 0 20px rgba(217, 70, 239, 0.25)',
        'pink-glow-strong': '0 0 35px rgba(255, 20, 147, 0.4)',
        'amethyst-glow': '0 0 30px rgba(168, 85, 247, 0.35)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'lotus-bloom': 'lotusBloom 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'avatar-breathe': 'avatarBreathe 4s ease-in-out infinite',
      },
      keyframes: {
        lotusBloom: {
          '0%': { transform: 'scale(0.3) rotate(-8deg)', opacity: '0.6', filter: 'drop-shadow(0 0 8px rgba(255, 20, 147, 0.4))' },
          '100%': { transform: 'scale(1.0) rotate(15deg)', opacity: '1', filter: 'drop-shadow(0 0 25px rgba(255, 20, 147, 0.8))' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.08)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        avatarBreathe: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
