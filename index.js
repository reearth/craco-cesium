"use strict";

const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackIncludeAssetPlugin = require("html-webpack-include-assets-plugin");

const cesiumSource = "node_modules/cesium/Source";
const cesiumWorkers = "../Build/Cesium/Workers";

module.exports = (
  { loadPartially, loadCSSinHTML } = {
    loadPartially: false,
    loadCSSinHTML: true
  }
) => ({
  overrideWebpackConfig: ({ webpackConfig, context: { env } }) => {
    const prod = env === "production";

    if (loadPartially) {
      // https://cesium.com/docs/tutorials/cesium-and-webpack/

      if (prod) {
        // Strip cesium pragmas
        webpackConfig.module.push({
          test: /.js$/,
          enforce: "pre",
          include: path.resolve(__dirname, cesiumSource),
          use: [
            {
              loader: "strip-pragma-loader",
              options: {
                pragmas: {
                  debug: false
                }
              }
            }
          ]
        });
      }

      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        cesium$: "cesium/Cesium",
        cesium: "cesium/Source"
      };

      webpackConfig.plugins.push(
        new CopyWebpackPlugin([
          {
            from: path.join(cesiumSource, cesiumWorkers),
            to: "cesium/Workers"
          },
          {
            from: path.join(cesiumSource, "Assets"),
            to: "cesium/Assets"
          },
          {
            from: path.join(cesiumSource, "Widgets"),
            to: "cesium/Widgets"
          }
        ]),
        ...(loadCSSinHTML
          ? [
              new HtmlWebpackIncludeAssetPlugin({
                append: false,
                assets: ["cesium/Widgets/widgets.css"]
              })
            ]
          : []),
        new webpack.DefinePlugin({
          CESIUM_BASE_URL: JSON.stringify("cesium")
        })
      );

      webpackConfig.output = {
        ...webpackConfig.output,
        // Needed to compile multiline strings in Cesium
        sourcePrefix: ""
      };

      webpackConfig.amd = {
        ...webpackConfig.amd,
        // Enable webpack-friendly use of require in Cesium
        toUrlUndefined: true
      };

      webpackConfig.node = {
        ...webpackConfig.node,
        // Resolve node module use of fs
        fs: "empty"
      };
    } else {
      // https://resium.darwineducation.com/installation1

      webpackConfig.plugins.push(
        new CopyWebpackPlugin([
          {
            from: `node_modules/cesium/Build/Cesium${prod ? "" : "Unminified"}`,
            to: "cesium"
          }
        ]),
        new HtmlWebpackIncludeAssetPlugin({
          append: false,
          assets: [
            ...(loadCSSinHTML ? ["cesium/Widgets/widgets.css"] : []),
            "cesium/Cesium.js"
          ]
        }),
        new webpack.DefinePlugin({
          CESIUM_BASE_URL: JSON.stringify("cesium")
        })
      );

      webpackConfig.externals = {
        ...webpackConfig.externals,
        cesium: "Cesium"
      };
    }

    return webpackConfig;
  }
});
