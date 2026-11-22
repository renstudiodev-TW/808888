import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 後端 server/ 是 Hono（hono/jsx 直接輸出 HTML），不是 Next.js：
  // 關掉 Next 專屬的導覽/head 規則；Hono JSX 不需要 React 的 key。
  {
    files: ["server/src/**/*.{ts,tsx}"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-head-element": "off",
      "react/jsx-key": "off",
    },
  },
  // scripts/ 是 Node CommonJS 腳本，允許 require()
  {
    files: ["scripts/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
