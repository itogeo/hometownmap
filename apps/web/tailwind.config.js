/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Civic palette
        'civic': {
          // Blues - primary actions, links
          'blue': {
            50: '#f0f7fa',
            100: '#d9eef5',
            200: '#b3dcea',
            300: '#7cc4db',
            400: '#3da5c4',
            500: '#1e6e8c',  // Primary river blue
            600: '#185a73',
            700: '#15495d',
            800: '#133a4a',
            900: '#0f2d3a',
          },
          // Greens - success, parks, positive
          'green': {
            50: '#f2f7f4',
            100: '#dfeee5',
            200: '#bedcca',
            300: '#8fc4a6',
            400: '#5da67e',
            500: '#3d7d5a',  // Primary forest green
            600: '#2f6347',
            700: '#274f3a',
            800: '#22402f',
            900: '#1c3527',
          },
          // Golds - warnings, highlights
          'gold': {
            50: '#faf8f3',
            100: '#f3efe3',
            200: '#e6dcc5',
            300: '#d5c59e',
            400: '#c4a86f',
            500: '#a38545',  // Primary earth gold
            600: '#8a6d38',
            700: '#6f5730',
            800: '#5c482a',
            900: '#4d3c25',
          },
          // Grays - neutral text, borders
          'gray': {
            50: '#faf9f7',
            100: '#f2f0eb',
            200: '#e3ded4',
            300: '#d1c9b8',
            400: '#b8ac95',
            500: '#9a8c72',
            600: '#7d7159',
            700: '#655a47',
            800: '#524a3b',
            900: '#443e32',
          },
        },
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
}
