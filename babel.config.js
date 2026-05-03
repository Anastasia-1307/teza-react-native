module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // React Native Reanimated plugin - trebuie să fie ultimul
      'react-native-reanimated/plugin',
    ],
    // Configurări specifice pentru Expo
    env: {
      production: {
        plugins: ['react-native-reanimated/plugin'],
      },
    },
  };
};
