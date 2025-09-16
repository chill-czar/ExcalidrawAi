import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "lib/generated/**", // ⬅️ ignore generated code (Prisma, wasm, etc.)
      "lib/prisma/**",
      "*.wasm.js",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-expressions": "off", // disable noisy unused expression rule
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ], // warn instead of error, allow _var
      "@typescript-eslint/no-explicit-any": "off", // allow 'any' for flexibility
      "@typescript-eslint/no-require-imports": "off", // allow require() in edge cases
    },
  },
];

export default eslintConfig;
