/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // 全站固定配色（与需求一致，不要在代码里随意新增亮色）
      colors: {
        ink: '#1B2A4A', // 背景主色：深空蓝
        dusk: '#3A2A5E', // 背景次色：暮光紫
        ember: '#FFB370', // 暖色光晕：暖橙
        aurora: '#7FD8FF', // 主强调：极光浅蓝
        lilac: '#C7A6FF', // 辅助色：淡紫
        paper: '#F5F1E8', // 正文：暖白
        muted: '#B8C5DC', // 次要文字：灰蓝白
      },
      maxWidth: {
        content: '1120px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
