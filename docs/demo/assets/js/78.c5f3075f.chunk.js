(window.webpackJsonp=window.webpackJsonp||[]).push([[78],{545:function(n,e,t){"use strict";t.r(e),e.default="/* globals d3, topojson */\nconst {Scene} = spritejs;\nconst container = document.getElementById('stage');\nconst width = 1000,\n  height = 750;\n\nconst scene = new Scene({\n  container,\n  width,\n  height,\n  mode: 'stickyWidth',\n});\n\nlet centered;\nconst projection = d3.geoAlbersUsa()\n  .scale(1070)\n  .translate([width / 2, height / 2]);\n\nconst path = d3.geoPath()\n  .projection(projection);\n\nconst layer = scene.layer('fglayer', {\n  handleEvent: true,\n});\n\nlayer.canvas.style.backgroundColor = '#8DBF59';\n\nd3.json('https://s4.ssl.qhres.com/static/4e8ebcccf5b5ea78.json', (error, us) => {\n  if(error) throw error;\n\n  d3.select(layer).selectAll('path')\n    .data(topojson.feature(us, us.objects.states).features)\n    .enter()\n    .append('path')\n    .attr('d', path)\n    .attr('strokeColor', '#618F4A')\n    .attr('lineWidth', 1)\n    .attr('fillColor', '#70A556')\n    .on('click', clicked);\n});\n\nfunction clicked(d) {\n  // If the click was on the centered state or the background, re-center.\n  // Otherwise, center the clicked-on state.\n  let translate = [0, 0],\n    centroid = [0, 0];\n\n  if(d && centered !== d) {\n    centroid = path.centroid(d);\n    translate = projection.translate();\n    centered = d;\n  }\n\n  d3.select(layer).selectAll('path')\n    .transition()\n    .duration(750)\n    .attr('pos', [translate[0] - centroid[0],\n      translate[1] - centroid[1]]);\n}"}}]);