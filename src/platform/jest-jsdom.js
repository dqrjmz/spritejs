import {mockDOM} from 'node-canvas-webgl';

mockDOM(window);
// 创建一个div元素
const container = document.createElement('div');
// 给div元素添加一个为stage的id
container.id = 'stage';
// 将创建的div添加到body中
document.body.appendChild(container);