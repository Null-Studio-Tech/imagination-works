import * as THREE from 'three';
import { detectWebgl } from './detect-webgl';
import './style.css';

const renderConfig = {
  get RENDER_WIDTH() { return window.innerWidth },
  get RENDER_HEIGHT() { return window.innerHeight },
  get RENDER_ASPECT() { return this.RENDER_WIDTH / this.RENDER_HEIGHT }
}


const createRender = () => {
  const render = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  render.setPixelRatio(window.devicePixelRatio);
  render.setSize(renderConfig.RENDER_WIDTH, renderConfig.RENDER_HEIGHT);
  window.addEventListener('resize', () => {
    render.setSize(renderConfig.RENDER_WIDTH, renderConfig.RENDER_HEIGHT)
  });
}





// 渲染流程
const init = () => {
  if (!detectWebgl()) return;
}


init();