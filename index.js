"use strict";

const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackTagsPlugin = require("html-webpack-tags-plugin");

let pnp;

try {
  pnp = require(`pnpapi`);
} catch (error) {
  // not in PnP; not a problem
}

let cesiumSource;

if (pnp) {
  // console.log("Craco Cesium using Pnp");
  const topLevelLocation = pnp.getPackageInformation(pnp.topLevel)
    .packageLocation;
  cesiumSource = path.resolve(
    pnp.resolveToUnqualified("cesium", topLevelLocation, {
      considerBuiltins: false
    }),
    "Source"
  );
} else {
  // console.log("Craco Cesium using normal module");
  cesiumSource = "node_modules/cesium/Source";
}

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
          include: cesiumSource,
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
            from: path.resolve(cesiumSource, "../Build/Cesium/Workers"),
            to: "cesium/Workers"
          },
          {
            from: path.resolve(cesiumSource, "Assets"),
            to: "cesium/Assets"
          },
          {
            from: path.resolve(cesiumSource, "Widgets"),
            to: "cesium/Widgets"
          }
        ]),
        ...(loadCSSinHTML
          ? [
              new HtmlWebpackTagsPlugin({
                append: false,
                tags: ["cesium/Widgets/widgets.css"]
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
            from: path.resolve(
              cesiumSource,
              `../Build/Cesium${prod ? "" : "Unminified"}`
            ),
            to: "cesium"
          }
        ]),
        new HtmlWebpackTagsPlugin({
          append: false,
          tags: [
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
