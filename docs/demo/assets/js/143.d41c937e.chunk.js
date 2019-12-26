(window.webpackJsonp=window.webpackJsonp||[]).push([[143],{610:function(n,e,t){"use strict";t.r(e),e.default="const {Scene, Sprite} = spritejs;\nconst container = document.getElementById('stage');\nconst scene = new Scene({\n  container,\n  width: 640,\n  height: 1000,\n  mode: 'stickyWidth',\n  // contextType: '2d',\n});\nconst layer = scene.layer();\n\n(async function () {\n  await scene.preload(\n    {id: 'snow', src: 'https://p5.ssl.qhimg.com/t01bfde08606e87f1fe.png'},\n    {id: 'cloud', src: 'https://p5.ssl.qhimg.com/t01d2ff600bae7fe897.png'}\n  );\n\n  const cloud = new Sprite('cloud');\n  cloud.attr({\n    anchor: [0.5, 0],\n    pos: [320, -50],\n    size: [200, 130],\n  });\n  layer.append(cloud);\n\n  function addRandomSnow() {\n    const snow = new Sprite('snow');\n    const x0 = 20 + Math.random() * 600,\n      y0 = 0;\n\n    snow.attr({\n      anchor: [0.5, 0.5],\n      pos: [x0, y0],\n      size: [50, 50],\n    });\n\n    snow.animate([\n      {x: x0 - 10},\n      {x: x0 + 10},\n    ], {\n      duration: 1000,\n      fill: 'forwards',\n      direction: 'alternate',\n      iterations: Infinity,\n      easing: 'ease-in-out',\n    });\n\n    const dropAnim = snow.animate([\n      {y: -200, rotate: 0},\n      {y: 2000, rotate: 1880},\n    ], {\n      duration: 15000,\n      fill: 'forwards',\n    });\n\n    dropAnim.finished.then(() => {\n      snow.remove();\n    });\n\n    layer.append(snow);\n  }\n\n  setInterval(addRandomSnow, 200);\n\n  /* globals dat */\n  const gui = new dat.GUI();\n\n  gui.add({\n    'height %': 50,\n  }, 'height %', 30, 100).onChange((val) => {\n    scene.container.style.paddingBottom = `${val}%`;\n    scene.resize();\n  });\n}());"}}]);