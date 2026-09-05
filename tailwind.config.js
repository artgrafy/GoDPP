/**
 * 팔레트를 CSS 변수로 정의한다.
 *
 * 이 앱은 다크 전용으로 만들어져 `bg-slate-950` / `text-white` / `text-slate-400` 같은
 * 클래스가 940곳 넘게 흩어져 있다. 각 자리에 `dark:` 변형을 다는 대신
 * **팔레트가 가리키는 값 자체를 테마별로 바꾼다**(globals.css).
 *   다크: slate 램프 그대로
 *   라이트: 램프를 뒤집는다 (950↔50, 900↔100 …) → bg-slate-950 이 밝은 배경이 된다
 *
 * 덕분에 마크업은 그대로 두고 테마가 일관되게 뒤집힌다.
 * 뒤집히면 안 되는 곳(인쇄 라벨·QR 용지)은 globals.css 의 `.paper` 가 변수를 되돌린다.
 */
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`;

const scale = (name, shades) =>
  Object.fromEntries(shades.map((s) => [s, rgb(`--c-${name}-${s}`)]));

module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        white: rgb('--c-white'),
        slate: scale('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950]),
        emerald: scale('emerald', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        sky: scale('sky', [200, 300, 400, 500, 600, 700]),
        teal: scale('teal', [200, 300, 400, 500, 600]),
        purple: scale('purple', [200, 300, 400, 500, 600, 700, 950]),
        indigo: scale('indigo', [400, 500, 600]),
        amber: scale('amber', [200, 300, 400, 500, 600]),
        rose: scale('rose', [200, 300, 400, 500, 600]),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
