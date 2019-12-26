(window.webpackJsonp=window.webpackJsonp||[]).push([[85],{552:function(n,e,t){"use strict";t.r(e),e.default="const {Scene, Sprite} = spritejs;\nconst container = document.getElementById('stage');\nconst scene = new Scene({\n  container,\n  width: 1200,\n  height: 600,\n});\nconst layer = scene.layer();\n\nconst birdsJsonUrl = 'https://s5.ssl.qhres.com/static/5f6911b7b91c88da.json';\nconst birdsRes = 'https://p.ssl.qhimg.com/d/inn/c886d09f/birds.png';\n\n(async function () {\n  const timeline = layer.timeline;\n\n  const playbackRate = document.getElementById('playbackRate');\n  const speedUp = document.getElementById('speedUp');\n  const slowDown = document.getElementById('slowDown');\n  const pause = document.getElementById('pause');\n  const resume = document.getElementById('resume');\n\n  function updateSpeed() {\n    playbackRate.innerHTML = `playbackRate: ${timeline.playbackRate.toFixed(1)}`;\n  }\n  speedUp.addEventListener('click', () => {\n    timeline.playbackRate += 0.5;\n    updateSpeed();\n  });\n  slowDown.addEventListener('click', () => {\n    timeline.playbackRate -= 0.5;\n    updateSpeed();\n  });\n  pause.addEventListener('click', () => {\n    timeline.playbackRate = 0;\n    updateSpeed();\n  });\n  resume.addEventListener('click', () => {\n    timeline.playbackRate = 1.0;\n    updateSpeed();\n  });\n\n  await scene.preload([birdsRes, birdsJsonUrl]);\n\n  for(let i = 0; i < 10; i++) {\n    if(i !== 5 && i !== 9) {\n      const bird = new Sprite('bird1.png');\n      bird.attr({\n        anchor: [0.5, 0.5],\n        pos: [-50, 100 + (i % 5) * 80],\n        scale: 0.6,\n      });\n      layer.append(bird);\n\n      bird.animate([\n        {texture: 'bird1.png'},\n        {texture: 'bird2.png'},\n        {texture: 'bird3.png'},\n        {texture: 'bird1.png'},\n      ], {\n        duration: 500,\n        iterations: Infinity,\n        easing: 'step-end',\n      });\n\n      const delay = i < 5 ? Math.abs(2 - i) * 300 : (4 - Math.abs(7 - i)) * 300;\n      bird.animate([\n        {x: -50},\n        {x: 1100},\n        {x: -50},\n      ], {\n        delay,\n        duration: 6000,\n        // direction: 'alternate',\n        iterations: Infinity,\n      });\n\n      bird.animate([\n        {scale: [0.6, 0.6]},\n        {scale: [-0.6, 0.6]},\n        {scale: [0.6, 0.6]},\n      ], {\n        delay,\n        duration: 6000,\n        iterations: Infinity,\n        easing: 'step-end',\n      });\n    }\n  }\n}());"}}]);