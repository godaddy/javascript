import gdConfig from "./packages/eslint-config-godaddy/index.js";

export default {
  ...gdConfig,
  rules: {
    //
    // This is used for both ES5 and ES6 config filesso we simply
    // disable it since it is inconsistent between platforms.
    //
    strict: 0
  }
};
