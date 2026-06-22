module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind v4 : jsxImportSource
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      }],
      // ⚠️ Reanimated plugin DOIT être en dernier
      'react-native-reanimated/plugin',
    ],
  };
};