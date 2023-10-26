import * as THREE from 'three';
import { detectWebgl } from './detect-webgl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import ScrollSmoother from 'gsap-trial/ScrollSmoother';
import { ScrollTrigger } from 'gsap-trial/ScrollTrigger';
import { gsap } from 'gsap-trial';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const renderConfig = {
  get RENDER_WIDTH() { return window.innerWidth },
  get RENDER_HEIGHT() { return window.innerHeight },
  get RENDER_ASPECT() { return this.RENDER_WIDTH / this.RENDER_HEIGHT }
}


const createRender = () => {
  const render = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  render.setPixelRatio(window.devicePixelRatio);
  render.setSize(renderConfig.RENDER_WIDTH, renderConfig.RENDER_HEIGHT);
  render.toneMapping = THREE.ACESFilmicToneMapping;
  render.toneMappingExposure = 1;
  window.addEventListener('resize', () => {
    render.setSize(renderConfig.RENDER_WIDTH, renderConfig.RENDER_HEIGHT)
  });
  return render;
}

const createScene = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaaaaaa);
  return scene;
}

const createCamera = () => {
  const camera = new THREE.PerspectiveCamera(35, renderConfig.RENDER_ASPECT, 0.1, 2000);
  window.addEventListener('resize', () => {
    camera.aspect = renderConfig.RENDER_ASPECT;
    camera.updateMatrix();
  });
  return camera;
}

const createOrbitControls = (render: THREE.WebGLRenderer, camera: THREE.Camera) => {
  const controls = new OrbitControls(camera, render.domElement);
  // controls.enableDamping = true;
  controls.minDistance = 0;
  controls.maxDistance = 3000;
  return controls;
}

const animate = (callback: () => void) => {
  const cb = callback;
  requestAnimationFrame(() => { cb() });
  cb();
}

// 渲染流程
const init = () => {
  if (!detectWebgl()) return;
  const appContainer = document.querySelector('#render');
  if (!appContainer) return;
  const renderer = createRender();
  appContainer.appendChild(renderer.domElement);
  const scene = createScene();
  const camera = createCamera();

  camera.position.set(0, 0, -35);

  const environment = new RoomEnvironment(renderer);
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(environment).texture;

  // const controls = createOrbitControls(renderer, camera);

  // controls.addEventListener('change', () => {
  //   renderer.render(scene, camera);
  //   // console.log(camera.position);
  // })

  const contentHeight = document.querySelector<HTMLDivElement>('#content')?.offsetHeight || 2048;
  const maxOffset = contentHeight - window.innerHeight;
  const a = (1 - 0) / (maxOffset - 0);
  const b = 1 - a * maxOffset;


  const controls = createOrbitControls(renderer, camera);
  controls.addEventListener('change', () => {
    console.log(camera.position)
  })

  const clocker = new THREE.Clock();

  new GLTFLoader().setPath('models/').load('myhome_export.gltf', (glft) => {
    console.log(glft);
    scene.add(glft.scene);
    // const target = glft.scene.getObjectByName('Object_3');
    // const target = glft.scene;
    // console.log(target);
    // target?.children.forEach((mesh) => {
    //   if (mesh?.isMesh === true) {
    //     const pointsMesh = new THREE.Points((mesh as THREE.Mesh).geometry, (mesh as THREE.Mesh).material);
    //     scene.add(pointsMesh);
    //   }
    // })
    // glft.scene.children.forEach((mesh) => {
    //   // scene.add(mesh);
    //   const pointsMesh = new THREE.Points((mesh as THREE.Mesh).geometry, (mesh as THREE.Mesh).material);
    //   scene.add(pointsMesh);
    // })
    // console.log(glft.scene.animations[0].uuid);
    const cameraObj = glft.cameras[0] as THREE.PerspectiveCamera;
    camera.position.copy(cameraObj.position);
    camera.rotation.copy(cameraObj.rotation);
    camera.aspect = cameraObj.aspect;
    camera.updateMatrix();
    cameraObj.aspect = renderConfig.RENDER_ASPECT;
    cameraObj.updateMatrix();
    let mixer: THREE.AnimationMixer;
    let cameraMixer: THREE.AnimationMixer;
    if (glft.animations.length > 0) {
      mixer = new THREE.AnimationMixer(glft.scene);
      cameraMixer = new THREE.AnimationMixer(cameraObj);
      cameraMixer.clipAction(glft.animations[0]).play();
      mixer.clipAction(glft.animations[1]).play();
      mixer.clipAction(glft.animations[2]).play();
    }
    renderer.render(scene, cameraObj);


    let progress = 0;
    ScrollSmoother.create({
      wrapper: '#app',
      content: '#content',
      smooth: 0.1,
      onUpdate: self => {
        console.log(progress);
        progress = a * self.offset(self.wrapper()) + b
        const delta = 8.3/200 * progress;
        mixer.update(delta);
        
        cameraMixer.update(delta);
        renderer.render(scene, cameraObj);
      }
    })

    // const animate = () => {

    //   requestAnimationFrame(animate);

    //   const delta = clocker.getDelta();
    //   mixer.update(delta);
    //   cameraMixer.update(delta);
    //   renderer.render(scene, cameraObj);
    //   // console.log(clocker.getDelta());

    // }
    // animate();

  })

}

init();