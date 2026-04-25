/** @type {import('tailwindcss').Config} */
export default {
  // This array tells Tailwind which files to scan for class names
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Everything defined directly in 'theme' OVERRIDES Tailwind's defaults
    // For example, if you defined 'colors' here, all default colors would be gone!
    extend: {
      // Everything defined in 'extend' MERGES with Tailwind's defaults
      colors: {
        // Your custom colors go here
        'primary': '#FF6347', // Use class: 'bg-primary', 'text-primary'
        'secondary': {
          100: '#f3defa', // Use class: 'bg-secondary-100'
          500: '#00796B', // Use class: 'bg-secondary-500'
          900: '#004D40', // Use class: 'bg-secondary-900'
        },
        'accent-blue': '#1DA1F2', // Use class: 'bg-accent-blue'
      },
      // You can also extend other utilities like spacing, fontSize, etc.
      // spacing: {
      //   '128': '32rem',
      // },
    },
  },
  plugins: [],
}