module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-primary': '#0a0a0f',
        'dark-secondary': '#1a1a2e',
        'dark-card': '#16213e',
        'accent': '#4f46e5',
        'accent-light': '#6366f1',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};