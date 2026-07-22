/** @type {import('tailwindcss').Config} */
import preset from '@mrdi/ui/tailwind-preset';

export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // 主题在 @mrdi/ui/tailwind-preset 中定义，这里只做局部覆盖
  },
  plugins: [],
};
