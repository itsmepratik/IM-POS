/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
      fontFamily: {
        sans: ["var(--font-formula1)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        "chonky-primary":
          "0 5px 0 hsl(var(--primary-shadow)), 0 6px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        "chonky-primary-hover":
          "0 7px 0 hsl(var(--primary-shadow)), 0 8px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
        "chonky-primary-active":
          "0 2px 0 hsl(var(--primary-shadow)), 0 3px 5px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
        "chonky-destructive":
          "0 5px 0 hsl(var(--destructive-shadow)), 0 6px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        "chonky-destructive-hover":
          "0 7px 0 hsl(var(--destructive-shadow)), 0 8px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
        "chonky-destructive-active":
          "0 2px 0 hsl(var(--destructive-shadow)), 0 3px 5px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
        "chonky-secondary":
          "0 5px 0 hsl(var(--secondary-shadow)), 0 6px 10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)",
        "chonky-secondary-hover":
          "0 7px 0 hsl(var(--secondary-shadow)), 0 8px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
        "chonky-secondary-active":
          "0 2px 0 hsl(var(--secondary-shadow)), 0 3px 5px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
        "chonky-outline":
          "0 5px 0 #d1d5db, 0 6px 10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)",
        "chonky-outline-hover":
          "0 7px 0 #d1d5db, 0 8px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
        "chonky-outline-active":
          "0 2px 0 #d1d5db, 0 3px 5px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
