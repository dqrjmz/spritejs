(window.webpackJsonp=window.webpackJsonp||[]).push([[112],{579:function(n,t,a){"use strict";a.r(t),t.default="const {Scene, Label} = spritejs;\nconst container = document.getElementById('stage');\nconst scene = new Scene({\n  container,\n  width: 600,\n  height: 360,\n  // contextType: '2d',\n});\nconst layer = scene.layer();\n\nconst box = new Label({\n  text: 'SpriteJS',\n  fontSize: '2rem',\n  anchor: [0.5, 0.5],\n  pos: [300, 180],\n  bgcolor: 'white',\n  borderWidth: 1,\n  padding: 25,\n});\nlayer.append(box);\n\n/* globals dat */\nconst gui = new dat.GUI();\nconst config = {\n  paddingLeft: box.attributes.paddingLeft,\n  paddingRight: box.attributes.paddingRight,\n  paddingTop: box.attributes.paddingTop,\n  paddingBottom: box.attributes.paddingBottom,\n};\ngui.add(config, 'paddingLeft', 0, 50).onChange((val) => {\n  box.attributes.paddingLeft = val;\n});\ngui.add(config, 'paddingRight', 0, 50).onChange((val) => {\n  box.attributes.paddingRight = val;\n});\n\ngui.add(config, 'paddingTop', 0, 50).onChange((val) => {\n  box.attributes.paddingTop = val;\n});\ngui.add(config, 'paddingBottom', 0, 50).onChange((val) => {\n  box.attributes.paddingBottom = val;\n});"}}]);