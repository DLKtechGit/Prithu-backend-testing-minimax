const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, isAssetFile },
  } = await getDefaultConfig();
  return {
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
        },
      }),
    },
    resolver: {
      sourceExts,
      isAssetFile,
      resolveRequest: (context, moduleName, platform) => {
        if (moduleName === 'onnxruntime-web/webgpu') {
          return {
            filePath: require.resolve('onnxruntime-web'),
            type: 'sourceFile',
          };
        }
        return context.resolveRequest(context, moduleName, platform);
      },
    },
  };
})();