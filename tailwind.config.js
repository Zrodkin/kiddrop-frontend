// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"], // ✅ Make sure this path matches your project structure
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/line-clamp'), // ✅ Enables `line-clamp-*` utilities
    // Add other plugins here if needed
  ],
};
