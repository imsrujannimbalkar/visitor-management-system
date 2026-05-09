import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import * as firebaseRulesParser from '@firebase/eslint-plugin-security-rules/dist/src/parser.js';

export default [
  {
    files: ["**/*.rules"],
    plugins: {
      "firebase-rules": firebaseRulesPlugin,
    },
    languageOptions: {
      parser: firebaseRulesParser,
    },
    rules: {
      ...firebaseRulesPlugin.configs['flat/recommended'].rules,
    },
  },
];
