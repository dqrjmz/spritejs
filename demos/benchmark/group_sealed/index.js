const container = document.getElementById('paper');
const spriteCount = document.getElementById('spriteCount');
const drawCalls = document.getElementById('drawCalls');

/* globals Animator */
const scene = new spritejs.Scene({container, width: 800, height: 800});

const bglayer = scene.layer('bg'), // 背景层
  // 前景层
  // 不代理事件，提升性能
  fglayer = scene.layer('fg', {
    handleEvent: false,
    bufferSize: 12000,
  });

const axisZero = [400, 400];
const circle = new spritejs.Block();

circle.attr({
  anchor: [0.5, 0.5],
  size: [800, 800],
  pos: axisZero,
  bgcolor: '#139',
  opacity: 0.5,
  borderRadius: 400,
});

bglayer.appendChild(circle);

function pointAdd(p1, p2 = [0, 0]) {
  return [p1[0] + p2[0], p1[1] + p2[1]].map(Math.round);
}

function pointSub(p1, p2 = [0, 0]) {
  return [p1[0] - p2[0], p1[1] - p2[1]].map(Math.round);
}

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function randomAnimate(sprite) {
  const fromPoint = sprite.attr('pos');
  const randomArc = Math.random() * 2 * Math.PI;
  const randomPoint = pointAdd([350 * Math.cos(randomArc), 350 * Math.sin(randomArc)], axisZero);

  const dist = pointSub(randomPoint, fromPoint);
  const distance = Math.round(Math.sqrt(dist[0] * dist[0] + dist[1] * dist[1]));
  const duration = 5 * distance + 100;

  const anim = new Animator(duration, (p) => {
    const pos = pointAdd(fromPoint, [p * dist[0], p * dist[1]]);
    const rotate = p * 720;
    // sprite.forceUpdate()
    sprite.attr({
      pos,
      rotate,
    });
  });

  await anim.animate();
  await sleep(500);
}

let _spriteCount = 0;
async function addSprite() {
  _spriteCount++;
  spriteCount.innerHTML = _spriteCount * 5;
  const group = new spritejs.Group();
  group.attr({
    anchor: [0.5, 0.5],
    pos: axisZero,
    size: [60, 60],
    bgcolor: 'white',
    // bgcolor: 'white',
  });

  const center = new spritejs.Block();
  center.attr({
    anchor: [0.5, 0.5],
    pos: [0, 0],
    size: [20, 20],
    borderRadius: 10,
    bgcolor: 'black',
  });

  const top = center.cloneNode();
  top.attr({
    pos: [0, -20],
  });

  const right = center.cloneNode();
  right.attr({
    pos: [20, 0],
  });

  const bottom = center.cloneNode();
  bottom.attr({
    pos: [0, 20],
  });

  const left = center.cloneNode();
  left.attr({
    pos: [-20, 0],
  });

  group.append(center, top, right, bottom, left);
  group.seal();

  fglayer.appendChild(group);

  // noprotect
  do {
    await randomAnimate(group); // eslint-disable-line no-await-in-loop
  } while(1);
}

requestAnimationFrame(function f() {
  if(_spriteCount < 500) {
    addSprite();
    requestAnimationFrame(f);
  }
});

setInterval(() => {
  // console.log('tick');
  drawCalls.innerHTML = fglayer.renderer._drawCalls;
}, 100);