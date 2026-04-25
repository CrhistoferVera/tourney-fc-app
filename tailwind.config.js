/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans:          ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
      },
      colors: {
        primary:   "#0D7A3E",
        "primary-dark": "#09572B",
        "primary-light": "#D4F5E2",
        accent:    "#F5820D",
        "accent-soft": "#FEF0DC",
        night:     "#0F1A14",
        carbon:    "#3D4F44",
        mist:      "#EBF0EC",
        white:     "#FFFFFF",
        danger:    "#E53935",
        info:      "#1A73E8",
      },
    },
  },
  plugins: [],
};
