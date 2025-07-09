// babel.config.js
// const { plugin } = require("mongoose"); // This line is unrelated to Babel config and should be removed

module.exports = function (api) {
    api.cache(true);
    return {
      presets: [
        ["babel-preset-expo", { jsxImportSource: "nativewind" }],
        "nativewind/babel",
      ],
      // Corrected: changed 'plugin' to 'plugins'
      plugins:[
        ["module:react-native-dotenv", {
        "env": ["development", "production"],
        "moduleName": "@env",
        "path": ".env",
        "safe": false,
        "allowUndefined": true,
        "verbose": false
      }]
      ]
    };
  };