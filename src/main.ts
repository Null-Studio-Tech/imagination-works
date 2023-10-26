import * as THREE from 'three';
import { detectWebgl } from './detect-webgl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import './style.css';
import ScrollSmoother from 'gsap-trial/ScrollSmoother';
import { ScrollTrigger } from 'gsap-trial/ScrollTrigger';
import { gsap } from 'gsap-trial';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { ClearMaskPass, MaskPass } from 'three/examples/jsm/postprocessing/MaskPass.js';
import { BleachBypassShader } from 'three/examples/jsm/shaders/BleachBypassShader.js';
import { SepiaShader } from 'three/examples/jsm/shaders/SepiaShader.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';
import { ColorifyShader } from 'three/examples/jsm/shaders/ColorifyShader.js';

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

const createCamera = (camera?: THREE.PerspectiveCamera) => {
  const _camera = camera ? camera : new THREE.PerspectiveCamera(35, renderConfig.RENDER_ASPECT, 0.1, 2000);
  window.addEventListener('resize', () => {
    _camera.aspect = renderConfig.RENDER_ASPECT;
    _camera.updateMatrix();
  });
  return _camera;
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
  let camera = createCamera();

  camera.position.set(0, 0, -35);

  //创建光源
  const lightA = new THREE.PointLight(0x7B8BD4, 4, 3.1);
  const lightB = new THREE.PointLight(0xFF9271, 0.1, 3.1);
  const lightC = new THREE.PointLight(0xFFE0DA, 4, 3.1);

  // const environment = new RoomEnvironment(renderer);
  // const pmremGenerator = new THREE.PMREMGenerator(renderer);
  // scene.environment = pmremGenerator.fromScene(environment).texture;

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

    const light1 = glft.scene.getObjectByName('lightProxy_01') as THREE.Mesh;
    lightA.position.copy(light1.position);
    glft.scene.remove(light1);
    glft.scene.add(lightA);

    const light2 = glft.scene.getObjectByName('lightProxy_02') as THREE.Mesh;
    lightB.position.copy(light2.position);
    glft.scene.remove(light2);
    glft.scene.add(lightB);

    const light3 = glft.scene.getObjectByName('lightProxy_03') as THREE.Mesh;
    lightC.position.copy(light3.position);
    glft.scene.remove(light3);
    glft.scene.add(lightC);

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
    const cameraObj = createCamera(glft.cameras[0] as THREE.PerspectiveCamera);
    cameraObj.aspect = renderConfig.RENDER_ASPECT;
    cameraObj.updateMatrix();
    let mixer: THREE.AnimationMixer;
    let cameraMixer: THREE.AnimationMixer;
    let cameraAction: THREE.AnimationAction;
    // let cameraAction:THREE.AnimationAction;
    if (glft.animations.length > 0) {
      mixer = new THREE.AnimationMixer(glft.scene);
      cameraMixer = new THREE.AnimationMixer(cameraObj);
      cameraAction = cameraMixer.clipAction(glft.animations[0]).play();
      mixer.clipAction(glft.animations[1]).play();
      mixer.clipAction(glft.animations[2]).play();
    }
    renderer.render(scene, cameraObj);


    const renderScene = new RenderPass(scene, cameraObj);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(renderConfig.RENDER_WIDTH, renderConfig.RENDER_HEIGHT), 0.7, 0.2, 0.5);
    bloomPass.strength = 0.15;
    bloomPass.radius = 0.2;
    bloomPass.threshold = 0.8;

    const outputPass = new OutputPass();


    //--------

    //

    const shaderBleach = BleachBypassShader;
    const shaderSepia = SepiaShader;
    const shaderVignette = VignetteShader;

    const effectBleach = new ShaderPass(shaderBleach);
    const effectSepia = new ShaderPass(shaderSepia);
    const effectVignette = new ShaderPass(shaderVignette);
    const gammaCorrection = new ShaderPass(GammaCorrectionShader);

    effectBleach.uniforms['opacity'].value = 0.95;

    effectSepia.uniforms['amount'].value = 0.9;

    effectVignette.uniforms['offset'].value = 0.95;
    effectVignette.uniforms['darkness'].value = 1.6;

    const effectBloom = new BloomPass(0.5);
    const effectFilm = new FilmPass(0.35);
    const effectFilmBW = new FilmPass(0.35, true);
    const effectDotScreen = new DotScreenPass(new THREE.Vector2(0, 0), 0.5, 0.8);

    const effectHBlur = new ShaderPass(HorizontalBlurShader);
    const effectVBlur = new ShaderPass(VerticalBlurShader);
    effectHBlur.uniforms['h'].value = 2 / (renderConfig.RENDER_WIDTH / 2);
    effectVBlur.uniforms['v'].value = 2 / (renderConfig.RENDER_HEIGHT / 2);

    const effectColorify1 = new ShaderPass(ColorifyShader);
    const effectColorify2 = new ShaderPass(ColorifyShader);
    effectColorify1.uniforms['color'] = new THREE.Uniform(new THREE.Color(1, 0.8, 0.8));
    effectColorify2.uniforms['color'] = new THREE.Uniform(new THREE.Color(1, 0.75, 0.5));

    const clearMask = new ClearMaskPass();
    const renderMask = new MaskPass(scene, cameraObj);
    const renderMaskInverse = new MaskPass(scene, cameraObj);

    renderMaskInverse.inverse = true;

    //

    const rtParameters = {
      stencilBuffer: true
    };

    const rtWidth = renderConfig.RENDER_WIDTH / 2;
    const rtHeight = renderConfig.RENDER_HEIGHT / 2;

    //

    const renderModel = new RenderPass(scene, cameraObj);

    renderModel.clear = false;

    // const composerScene = new EffectComposer(renderer, new THREE.WebGLRenderTarget(rtWidth * 2, rtHeight * 2, rtParameters));

    // composerScene.addPass(renderBackground);
    // composerScene.addPass(renderModel);
    // composerScene.addPass(renderMaskInverse);
    // composerScene.addPass(effectHBlur);
    // composerScene.addPass(effectVBlur);
    // composerScene.addPass(clearMask);
    //--------

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);

    // composer.addPass(gammaCorrection);
    // composer.addPass(effectSepia);
    // composer.addPass(effectFilm);
    // composer.addPass(effectVignette);


    // cameraAction.getClip().duration
    // const duration = glft.animations[0].duration;
    // const frames = glft.animations[0].tracks.length;


    let progress = 0;
    ScrollSmoother.create({
      wrapper: '#app',
      content: '#content',
      smooth: 0.5,
      onUpdate: self => {
        // console.log('progress', progress);
        // progress = a * self.offset(self.wrapper()) + b
        // // const delta = duration / frames * progress;
        // const delta = 0.01;
        // console.log('delta', delta);
        // mixer.update(delta);

        // cameraMixer.update(delta);
        // renderer.render(scene, cameraObj);
      }
    })

    const animate = () => {

      requestAnimationFrame(animate);

      const delta = clocker.getDelta();
      mixer.update(delta);
      cameraMixer.update(delta);
      renderer.render(scene, cameraObj);
      composer.render(delta);
      // console.log(clocker.getDelta());

    }
    animate();

  })

}

init();