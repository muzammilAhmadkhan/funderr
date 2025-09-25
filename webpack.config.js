// webpack.config.js - extend expo webpack config
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  // Use Expo's default webpack config
  const config = await createExpoWebpackConfigAsync(env, argv);
  return config;
};
