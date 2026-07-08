/*
 * Babel configuration.
  
  Si reanimated doit etre reintroduit plus tard (development build),
  il DOIT etre le DERNIER plugin de la liste.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // PLUS DE plugin reanimated — cause crash TurboModule
    ],
  };
};