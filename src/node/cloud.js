import {MeshCloud} from '@mesh.js/core';
import Node from './node';
import ownerDocument from '../document';

const _amount = Symbol('amount');
const _meshCloud = Symbol('meshCloud');

export default class Cloud extends Node {
  constructor(node, amount = 1) {
    super();
    this.meshNode = node;
    node.connect(this);
    this[_amount] = amount;
    this[_meshCloud] = null;
  }

  get meshCloud() {
    const meshNode = this.meshNode;
    const amount = this[_amount];

    if(!this[_meshCloud] && meshNode.mesh) {
      this[_meshCloud] = new MeshCloud(meshNode.mesh, amount);
      const {bgcolor, fillColor} = meshNode.attributes;
      for(let i = 0; i < this[_amount]; i++) {
        if(bgcolor) {
          this[_meshCloud].setFillColor(i, bgcolor);
        } else if(fillColor) {
          this[_meshCloud].setFillColor(i, fillColor);
        }
      }
    }
    if(this[_meshCloud].amount !== amount) {
      this[_meshCloud].amount = amount;
    }
    return this[_meshCloud];
  }

  /* override */
  get isVisible() {
    return !!this.meshNode && this.meshNode.isVisible;
  }

  get amount() {
    return this[_amount];
  }

  set amount(value) {
    this[_amount] = value;
  }


  brightness(idx, p) {
    if(this.meshCloud) {
      this.meshCloud.brightness(idx, p);
      this.forceUpdate();
    }
  }

  contrast(idx, p) {
    if(this.meshCloud) {
      this.meshCloud.contrast(idx, p);
      this.forceUpdate();
    }
  }

  /* override */
  draw(meshes = []) {
    super.draw(meshes);

    if(this.meshCloud) {
      meshes.push(this.meshCloud);
    }

    return meshes;
  }

  getTransform(idx) {
    if(this.meshCloud) return this.meshCloud.getTransform(idx);
  }

  grayscale(idx, p) {
    if(this.meshCloud) {
      this.meshCloud.grayscale(idx, p);
      this.forceUpdate();
    }
  }

  hueRotate(idx, deg) {
    if(this.meshCloud) {
      this.meshCloud.hueRotate(idx, deg);
      this.forceUpdate();
    }
  }

  invert(idx, p) {
    if(this.meshCloud) {
      this.meshCloud.invert(idx, p);
      this.forceUpdate();
    }
  }

  /* override */
  isPointCollision(x, y) {
    if(!this.meshCloud) return false;

    const pointerEvents = this.attributes.pointerEvents;
    if(pointerEvents === 'none') return false;
    if(pointerEvents !== 'all' && !this.isVisible) return false;
    let which = 'both';
    if(pointerEvents === 'visibleFill') which = 'fill';
    if(pointerEvents === 'visibleStroke') which = 'stroke';
    for(let i = 0; i < this[_amount]; i++) {
      if(!this.meshCloud.isPointCollision(i, [x, y], which)) return false;
    }
    return true;
  }

  opacity(idx, p) {
    if(this.meshCloud) {
      this.meshCloud.opacity(idx, p);
      this.forceUpdate();
    }
  }

  rotate(idx, ang, [ox, oy] = [0, 0]) {
    const rad = Math.PI * ang / 180;
    if(this.meshCloud) {
      const {x: x0, y: y0} = this.meshNode.attributes;
      this.meshCloud.rotate(idx, rad, [ox + x0, oy + y0]);
      this.forceUpdate();
    }
  }

  saturate(idx, p) {
    if(this.meshCloud) {
      this.meshCloud.saturate(idx, p);
      this.forceUpdate();
    }
  }

  scale(idx, [x, y = x], [ox, oy] = [0, 0]) {
    if(this.meshCloud) {
      const {x: x0, y: y0} = this.meshNode.attributes;
      this.meshCloud.scale(idx, [x, y], [ox + x0, oy + y0]);
      this.forceUpdate();
    }
  }

  setColorTransform(idx, m) {
    if(this.meshCloud) {
      this.meshCloud.setColorTransform(idx, m);
      this.forceUpdate();
    }
  }

  setFillColor(idx, color) {
    if(this.meshCloud) {
      this.meshCloud.setFillColor(idx, color);
      this.forceUpdate();
    }
  }

  sepia(idx, p) {
    if(this.meshCloud) {
      this.meshCloud.sepia(idx, p);
      this.forceUpdate();
    }
  }

  /* override */
  setResolution({width, height}) {
    super.setResolution({width, height});
    this.meshNode.setResolution({width, height});
  }

  setStrokeColor(idx, color) {
    if(this.meshCloud) {
      this.meshCloud.setStrokeColor(idx, color);
      this.forceUpdate();
    }
  }

  setTransform(idx, m) {
    if(this.meshCloud) {
      this.meshCloud.setTransform(idx, m);
      this.forceUpdate();
    }
  }

  skew(idx, [x, y = x], [ox, oy] = [0, 0]) {
    if(this.meshCloud) {
      const {x: x0, y: y0} = this.meshNode.attributes;
      this.meshCloud.skew(idx, [x, y], [ox + x0, oy + y0]);
      this.forceUpdate();
    }
  }

  transform(idx, m) {
    if(this.meshCloud) {
      this.meshCloud.transform(idx, m);
      this.forceUpdate();
    }
  }

  transformColor(idx, m) {
    if(this.meshCloud) {
      this.meshCloud.transformColor(idx, m);
      this.forceUpdate();
    }
  }

  translate(idx, [x, y]) {
    if(this.meshCloud) {
      this.meshCloud.translate(idx, [x, y]);
      this.forceUpdate();
    }
  }
}

ownerDocument.registerNode(Cloud, 'cloud');