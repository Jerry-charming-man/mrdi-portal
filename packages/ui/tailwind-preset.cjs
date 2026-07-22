/**
 * @mrdi/ui Tailwind Preset
 * 4 个前端 SPA（mrdi-portal / mdm-web / cimrms-web / cimims-web / perm-web）
 * 都在自己的 tailwind.config.js 里 preset 这个，共享品牌色 + shadow + radius + font
 *
 * MRDI 品牌色系：
 *   - 主色 #00B388（凝绿）— 按钮/高亮/选中
 *   - 绝黑 #000000 — 侧边栏/主要文字
 *   - 纯白 #FFFFFF — 卡片/内容区
 *   - 锻灰 #D9D9D6 — 分割线/边框
 *   - 浅灰底 #F5F5F5 — 页面背景
 *   - 辅助（仅图表）：研蓝/邃紫/极光粉/闪光绿
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        ignite: {
          DEFAULT: '#00B388',
          2: '#008866',
          soft: '#E6FAF4',
          dim: '#9AD6C2',
          deep: '#003B2C',
        },
        ink: {
          DEFAULT: '#000000',
          2: '#1F1F1F',
          3: '#6B6B6B',
          4: '#9C9C9C',
          5: '#D9D9D6',
        },
        pure: '#FFFFFF',
        module: '#F5F5F5',
        progress: {
          DEFAULT: '#D9D9D6',
          strong: '#B5B5B2',
        },
        research: '#307FE2',
        indigo: '#6A6DCD',
        pink: '#EF60A3',
        flash: '#3CDBC0',
        success: {
          DEFAULT: '#15803D',
          soft: '#E7F6EE',
        },
        warn: {
          DEFAULT: '#B45309',
          soft: '#FFF3E0',
        },
        danger: {
          DEFAULT: '#B91C1C',
          soft: '#FEE7E7',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Noto Sans CJK SC', 'Microsoft JhengHei UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
};
