module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind v4 : jsxImportSource
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // Reanimated v3 plugin DOIT etre en dernier
      'react-native-reanimated/plugin',
    ],
  };
};