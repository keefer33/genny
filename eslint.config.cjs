// ESLint Flat Config in CJS syntax
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const reactPlugin = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const importPlugin = require("eslint-plugin-import");
const prettierPlugin = require("eslint-plugin-prettier");
const unusedImports = require("eslint-plugin-unused-imports");

module.exports = [
  {
    ignores: [
      "node_modules",
      "build",
      "dist",
      "coverage",
      ".react-router/**",
      "eslint.config.cjs",
      ".eslintrc.cjs",
      "**/*.css",
      "**/*.svg",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      import: importPlugin,
      prettier: prettierPlugin,
      "unused-imports": unusedImports,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // Allow any for now (can be tightened later per module)
      "@typescript-eslint/no-explicit-any": "off",
      // Prefer unused-imports, but treat TS unused vars as warnings and allow _prefix
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "unused-imports/no-unused-imports": "error",
      "prettier/prettier": ["error"],
    },
    settings: {
      react: { version: "detect" },
    },
  },
  // Relax rules for config files
  {
    files: ["eslint.config.cjs", ".eslintrc.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
    languageOptions: {
      globals: { module: "readonly", require: "readonly" },
    },
  },
];
