import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontSize: {
      xs: "0.75rem", // 12px at base 16px
      sm: "0.875rem", // 14px at base 16px
      base: "1rem", // 16px at base 16px
      lg: "1.125rem", // 18px at base 16px
      xl: "1.25rem", // 20px at base 16px
      "2xl": "1.5rem", // 24px at base 16px
      "3xl": "1.875rem", // 30px at base 16px
      "4xl": "2.25rem", // 36px at base 16px
      "5xl": "3rem", // 48px at base 16px
      "6xl": "3.75rem", // 60px at base 16px
      "7xl": "4.5rem", // 72px at base 16px
      "8xl": "6rem", // 96px at base 16px
      "9xl": "8rem", // 128px at base 16px
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-formula1)", "var(--font-sans)"],
        formula1: ["var(--font-formula1)"],
        mono: ["var(--font-geist-mono)"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#d5f365",
          foreground: "#000000",
        },
        "brand-lime": "#d5f365",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      borderColor: {
        DEFAULT: "hsl(var(--border))",
      },
      boxShadow: {
        "chonky-primary":
          "0 5px 0 hsl(var(--primary-shadow)), 0 6px 10px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        "chonky-primary-hover":
          "0 7px 0 hsl(var(--primary-shadow)), 0 8px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
        "chonky-primary-active":
          "0 2px 0 hsl(var(--primary-shadow)), 0 3px 5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        "chonky-destructive":
          "0 5px 0 hsl(var(--destructive-shadow)), 0 6px 10px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        "chonky-destructive-hover":
          "0 7px 0 hsl(var(--destructive-shadow)), 0 8px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
        "chonky-destructive-active":
          "0 2px 0 hsl(var(--destructive-shadow)), 0 3px 5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        "chonky-secondary":
          "0 5px 0 hsl(var(--secondary-shadow)), 0 6px 10px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        "chonky-secondary-hover":
          "0 7px 0 hsl(var(--secondary-shadow)), 0 8px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
        "chonky-secondary-active":
          "0 2px 0 hsl(var(--secondary-shadow)), 0 3px 5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
      },
      animationTimingFunction: {
        "subtle-bounce": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionTimingFunction: {
        "subtle-bounce": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        "fade-out-center": {
          "0%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          "100%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.95)" },
        },
        "fade-out-overlay": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-out-center": "fade-out-center 0.3s ease-in-out forwards",
        "fade-out-overlay": "fade-out-overlay 0.3s ease-in-out forwards",
      },
    },
  },
  plugins: [animate],
};

export default config;
