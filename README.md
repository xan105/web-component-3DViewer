About
=====

Web-component to render 3D model in the browser.

Currently supports: `STL` files. I might add more later on.

<p align="center">
  <img src="https://github.com/xan105/web-component-3DViewer/raw/main/screenshot/benchy.png">
  <em>3DBenchy</em>
</p>

📦 Scoped `@xan105` packages are for my own personal use but feel free to use them.

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg?style=flat-square)](https://www.webcomponents.org/element/@xan105/3dviewer)

Example
=======

HTML:

```html
  <stl-viewer src="path/to/stl" rotate="on" zoom="on"></stl-viewer>
```

Import and define the Web-component:

```js
import { STLViewer } from "@xan105/3dviewer"
customElements.define("stl-viewer", STLViewer);
```

Conditional Import

```js
if (document.querySelector("stl-viewer")) {
  await import("@xan105/3dviewer");
  customElements.define("stl-viewer", STLViewer);
  await customElements.whenDefined("stl-viewer")
}
```

Install
=======

```
npm i @xan105/3dviewer
```

💡 The bundled library and its minified version can be found in the `./dist` folder.

### Via importmap

  Create an importmap and add it to your html:

  ```html
    <script type="importmap">
    {
      "imports": {
        "@xan105/3dviewer": "./path/to/node_modules/@xan105/3dviewer/dist/3DViewer.min.js"
      }
    }
    </script>
    <script type="module">
      import { STLViewer } from "@xan105/3dviewer"
      customElements.define("stl-viewer", STLViewer);
    </script>
    </body>
  </html>
  ```

Styling
=======

You can use css `background-color` and `color` to change the model's color and background.
By default, the background is transparent and the color is blue (#6699ff).

API
===

⚠️ This module is only available as an ECMAScript module (ESM) and is intended for the browser.

## Named export

### `STLViewer(): Class`

This is a Web-component as such you need to define it:

```js
import { STLViewer } from "/path/to/3dviewer.js"
customElements.define("stl-viewer", STLViewer);
```

> [!TIP]
> This Web-component uses an [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to pause rendering when it isn't inside the viewport.

**Events**

  - `change()`

    The source (src) attribute has changed.

  - `controls()`

    One of the "controls" attribute has changed (zoom, rotate, pan, inertia, gizmos).
    
  - `requestAnimationFrame()`

    Web-component has entered the viewport and is requesting an animation frame to the browser.

  - `cancelAnimationFrame()`

    Web-component has leaved the viewport and is canceling the animation frame to the browser.

  - `resized()`

    Web-component renderer has been resized.
    
**Attribute / Property**

  - `src: string`
    
    Path/URL to the `.stl` file to load.
    
  - `pan: string [on|off]` (on)
  
    Enable or disable camera panning. Default is enable.
  
  - `zoom: string [on|off]` (on)
  
    Enable or disable zooming of the camera. Default is enable. 
  
  - `rotate: string [on|off]` (on)
  
    Enable or disable camera rotation. Default is enable.
    
  - `inertia: string [on|off]` (off)
  
    Enable to give intertia to rotation. Default is disabled. 
  
  - `gizmos": string [on|off]` (off)

    Enable gizmos ie: circular arcs around the axes to rotate the object. Default is disabled.
    
    Gizmos are visual 3D widget. They are used to give visual debugging.
    
**Methods**
  
  > [!NOTE]
  > The following methods are used automagically, you should not have to use them but they are available if you need them.
  
  - `resize(): void`
  
    Resize the renderer, camera and projection matrix to the current Web-component width and height. Defaults to 320x480 if width/height are equal to zero.
  
  - `load(): Promise<void>`
  
    Load the geometry from the model and set up the scene.
  
  - `animate(): void`
  
    Render the scene and request an anination frame to the browser.