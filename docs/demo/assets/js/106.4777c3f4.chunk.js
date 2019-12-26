(window.webpackJsonp=window.webpackJsonp||[]).push([[106],{573:function(n,e,o){"use strict";o.r(e),e.default="const {Scene, Group, Path} = spritejs;\nconst container = document.getElementById('stage');\nconst scene = new Scene({\n  container,\n  width: 1200,\n  height: 600,\n});\nconst layer = scene.layer();\nconst arcD = 'M0 0L 50 0A50 50 0 0 1 43.3 25z';\n\nconst group = new Group();\ngroup.attr({\n  size: [300, 300],\n  pos: [600, 300],\n  anchor: [0.5, 0.5],\n  bgcolor: '#cec',\n  borderRadius: 150,\n});\nlayer.append(group);\n\nfor(let i = 0; i < 6; i++) {\n  const arc = new Path();\n  arc.attr({\n    d: arcD,\n    scale: 3,\n    anchor: [0, 0.5],\n    strokeColor: 'red',\n    fillColor: `rgb(${i * 99 % 255}, 0, 0)`,\n    rotate: i * 60,\n  });\n  group.append(arc);\n}\n\ngroup.animate([\n  {rotate: 0},\n  {rotate: 360},\n], {\n  duration: 3000,\n  iterations: Infinity,\n});"}}]);