(window.webpackJsonp=window.webpackJsonp||[]).push([[108],{575:function(n,e,t){"use strict";t.r(e),e.default="const {Scene, Label} = spritejs;\nconst container = document.getElementById('stage');\nconst scene = new Scene({\n  container,\n  width: 1200,\n  height: 600,\n});\nconst layer = scene.layer();\nconst keys = [\n  'qwertyuiop',\n  'asdfghjkl',\n  'zxcvbnm',\n];\nfor(let i = 0; i < 3; i++) {\n  const keyButtons = [...keys[i]];\n  for(let j = 0; j < keyButtons.length; j++) {\n    const key = new Label({\n      id: keyButtons[j],\n      text: keyButtons[j],\n      pos: [250 + j * 80, 200 + i * 100],\n      font: '42px Arial',\n      borderWidth: 4,\n      borderColor: 'black',\n      size: [50, 50],\n      anchor: [0.5, 0.5],\n      textAlign: 'center',\n      lineHeight: 50,\n    });\n\n    layer.append(key);\n  }\n}\n\ndocument.addEventListener('keydown', (event) => {\n  const key = event.key;\n  const button = scene.getElementById(key);\n  button.attr({\n    bgcolor: 'grey',\n    fillColor: 'white',\n  });\n});\n\ndocument.addEventListener('keyup', (event) => {\n  const key = event.key;\n  const button = scene.getElementById(key);\n  button.attr({\n    bgcolor: '',\n    fillColor: 'black',\n  });\n});"}}]);