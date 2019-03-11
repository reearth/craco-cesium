# craco-cesium

Let's use 🌍[Cesium](https://cesiumjs.org) with [create-react-app](https://github.com/facebook/create-react-app) today!

This is a plugin for [@craco/craco](https://github.com/sharegate/craco).

## Very very easy usage

### 1. Create a React project

```sh
npm -g i create-react-app # or yarn global add create-react-app
create-react-app example
cd example
```

### 2. Install modules

In your create-react-app project, install modules:

```sh
npm install --save @craco/craco craco-cesium cesium
# or
yarn add @craco/craco craco-cesium cesium
```

### 3. Rewrite npm scripts

Rewrite npm scripts in `package.json` as following:

```js
{
  // ...
  "scripts": {
    "start": "craco start", // react-scripts -> craco
    "build": "craco build", // react-scripts -> craco
    "test": "craco test",   // react-scripts -> craco
    "eject": "react-scripts eject"
  },
  // ...
}
```

### 4. Create craco config file

Create `craco.config.js` in the proejct root:

```js
const CracoCesiumPlugin = require("craco-cesium");

module.exports = {
  plugins: [
    {
      plugin: CracoCesiumPlugin()
    }
  ]
};
```

### 5. Congratulations! 🎉

Set up is complete! Enjoy your Cesium life.

[Resium](https://resium.darwineducation.com) is also recommended.

You can import Cesium as following:

```js
import { Viewer, Entity, Color } from "cesium";
```

## Options

If the option is omiited, the default options is used:

```js
CracoCesiumPlugin({
  loadPartially: false,
  loadCSSinHTML: true
});
```

### `loadPartially`

If false, whole Cesium will be loaded in HTML and `window.Cesium` is used in `import { ... } from "cesium";`.

Otherwise, Cesium will be load partially and bundled in the JS. For details, refer to [Cesium official tutorial](https://cesium.com/docs/tutorials/cesium-and-webpack/).

### `loadCSSinHTML`

If true, `Widgets/widgets.css` in Cesium is loaded in HTML.

Otherwise, you have to load the CSS once manually as following.

If `loadPartially` is true:

```js
import "cesium/Widgets/widgets.css";
```

Otherwise:

```js
import "cesium/Build/CesiumUnminified/Widgets/widgets.css";
```
