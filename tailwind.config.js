/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E86A33',      // Naranja intenso - cálido y appetitoso
          light: '#F4A261',        // Naranja suave
          dark: '#C4551F',          // Naranja profundo
        },
        accent: {
          DEFAULT: '#E76F51',      // Rojo-naranja - energético
          light: '#F4A261',       // Naranja suave
          dark: '#C4551F',        // Naranja profundo
        },
        secondary: {
          DEFAULT: '#2D6A4F',     // Verde como secundario
          light: '#40916C',
          dark: '#1B4332',
        },
        crema: '#FFF8F0',          // Fondo cálido
        warm: '#FFEDD5',          // Tono cálido neutro
        error: '#DC3545',
        success: '#28A745',
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0, 0, 0, 0.06)',
        md: '0 8px 24px rgba(0, 0, 0, 0.08)',
        lg: '0 16px 48px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};