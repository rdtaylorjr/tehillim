import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  { ignores: ["dist", "coverage", "node_modules"] },

  { settings: { react: { version: "detect" } } },

  js.configs.recommended,

  // Type-aware linting: catches misuse a syntax-only pass cannot see.
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  jsxA11y.flatConfigs.recommended,
  reactHooks.configs.flat.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { "react-refresh": reactRefresh },
    rules: {
      "react-refresh/only-export-components": ["error", { allowConstantExport: true }],

      // A component that takes no props and returns markup should be a function, not a class.
      "react/prefer-stateless-function": "error",
      "react/jsx-no-useless-fragment": "error",
      "react/jsx-boolean-value": ["error", "never"],
      "react/self-closing-comp": "error",
      "react/no-array-index-key": "error",
      "react/jsx-key": ["error", { checkFragmentShorthand: true }],
      "react/destructuring-assignment": ["error", "always"],
      "react/function-component-definition": [
        "error",
        { namedComponents: "function-declaration", unnamedComponents: "arrow-function" },
      ],

      // An explicit return type keeps a component's contract readable at its definition.
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",

      "no-console": ["error", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
    },
  },

  // Test files assert against the DOM, where non-null access is the point.
  {
    files: ["**/*.test.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/unbound-method": "off",
    },
  },

  { files: ["**/*.{js,cjs,mjs}"], extends: [tseslint.configs.disableTypeChecked] },
);
