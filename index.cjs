"use strict";

const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackTagsPlugin = require("html-webpack-tags-plugin");

let pnp;
try {
  pnp = require("pnpapi");
} catch (error) {
  // not in PnP; not a problem
}

let cesiumSource;
if (pnp) {
  // Craco Cesium using Pnp
  const topLevelLocation = pnp.getPackageInformation(pnp.topLevel)
    .packageLocation;
  cesiumSource = path.resolve(
    pnp.resolveToUnqualified("cesium", topLevelLocation, {
      considerBuiltins: false
    }),
    "Source"
  );
} else {
  // Craco Cesium using normal module
  cesiumSource = "node_modules/cesium/Source";
}

let amd = false;
try {
  const cesiumPackageJson = require(path.resolve(
    cesiumSource,
    "..",
    "package.json"
  ));
  const versionStr = cesiumPackageJson.version.split(".");
  const version = parseFloat(versionStr[0] + "." + versionStr[1]);
  amd = version < 1.63;
} catch (e) {
  // ignore
}

module.exports = options => ({
  overrideWebpackConfig: ({ webpackConfig, context: { env } }) => {
    const { loadPartially, loadCSSinHTML, cesiumPath } = {
      loadPartially: false,
      loadCSSinHTML: true,
      cesiumPath: "cesium",
      ...options
    };

    const prod = env === "production";

    if (loadPartially) {
      // https://github.com/AnalyticalGraphicsInc/cesium-webpack-example
      // https://cesium.com/docs/tutorials/cesium-and-webpack/

      if (prod) {
        // Strip cesium pragmas
        webpackConfig.module.rules.push({
          test: /.js$/,
          enforce: "pre",
          include: path.resolve(__dirname, cesiumSource),
          sideEffects: false,
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
            from: path.join(cesiumSource, "../Build/Cesium/Workers"),
            to: path.join(cesiumPath, "Workers")
          },
          {
            from: path.join(cesiumSource, "../Build/Cesium/ThirdParty"),
            to: path.join(cesiumPath, "ThirdParty")
          },
          {
            from: path.join(cesiumSource, "Assets"),
            to: path.join(cesiumPath, "Assets")
          },
          {
            from: path.join(cesiumSource, "Widgets"),
            to: path.join(cesiumPath, "Widgets")
          }
        ]),
        ...(loadCSSinHTML
          ? [
              new HtmlWebpackTagsPlugin({
                append: false,
                tags: [path.join(cesiumPath, "Widgets", "widgets.css")]
              })
            ]
          : []),
        new webpack.DefinePlugin({
          CESIUM_BASE_URL: JSON.stringify(cesiumPath)
        })
      );

      if (amd) {
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
      }

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
            from: path.join(
              cesiumSource,
              `../Build/Cesium${prod ? "" : "Unminified"}`
            ),
            to: cesiumPath
          }
        ]),
        new HtmlWebpackTagsPlugin({
          append: false,
          tags: [
            ...(loadCSSinHTML ? ["cesium/Widgets/widgets.css"] : []),
            path.join(cesiumPath, "Cesium.js")
          ]
        }),
        new webpack.DefinePlugin({
          CESIUM_BASE_URL: JSON.stringify(cesiumPath)
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
