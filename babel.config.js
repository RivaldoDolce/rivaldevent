module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // Reanimated plugin DOIT etre en DERNIER
      'react-native-reanimated/plugin',
    ],
  };
};