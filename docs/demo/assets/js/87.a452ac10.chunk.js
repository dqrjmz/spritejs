(window.webpackJsonp=window.webpackJsonp||[]).push([[87],{554:function(n,e,s){"use strict";s.r(e),e.default="const {Scene, Arc, Ellipse} = spritejs;\nconst container = document.getElementById('stage');\nconst scene = new Scene({\n  container,\n  width: 1200,\n  height: 600,\n});\nconst layer = scene.layer();\n\nconst fan = new Arc({\n  pos: [300, 300],\n  radius: 100,\n  startAngle: 0,\n  endAngle: 120,\n  fillColor: 'blue',\n});\nlayer.append(fan);\n\nconst fan2 = fan.cloneNode();\nfan2.attr({\n  pos: [300, 150],\n  closeType: 'sector',\n});\n\nlayer.append(fan2);\n\nconst ellipse = new Ellipse({\n  pos: [700, 300],\n  radiusX: 150,\n  radiusY: 100,\n  startAngle: 0,\n  endAngle: 240,\n  lineWidth: 6,\n  strokeColor: 'red',\n  fillColor: 'green',\n  closeType: 'sector',\n});\nlayer.append(ellipse);"}}]);