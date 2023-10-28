import * as THREE from 'three';
import { detectWebgl } from './detect-webgl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { ScrollSmoother } from 'gsap-trial/ScrollSmoother';
import { ScrollTrigger } from 'gsap-trial/ScrollTrigger';
import { gsap } from 'gsap-trial';

import './style.css';

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
    console.log('render size', renderConfig.RENDER_WIDTH, renderConfig.RENDER_HEIGHT)
    render.setSize(renderConfig.RENDER_WIDTH, renderConfig.RENDER_HEIGHT)
    render.setPixelRatio(window.devicePixelRatio);
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
  return _camera;
}

const createOrbitControls = (render: THREE.WebGLRenderer, camera: THREE.Camera) => {
  const controls = new OrbitControls(camera, render.domElement);
  controls.enableDamping = true;
  controls.minDistance = 0;
  controls.maxDistance = 3000;
  return controls;
}

let sun, sunGeometry, pointGeometry: THREE.BufferGeometry, sunScales: Float32Array, sunPoints: THREE.Points, positionArr, originSunPositions: Float32Array, randomParams: Array<any>=[];

const initSun = (glft: any ) => {

    // 太阳
    sun =  glft.scene.getObjectByName('sun') as THREE.Mesh;

    const r = 3;
    sunGeometry = new THREE.SphereGeometry(r, 100, 100);
    sunGeometry.name = 'sunGeometry';
    console.log('sun-->', sun)

    pointGeometry = new THREE.BufferGeometry();
    positionArr = sunGeometry.attributes.position.array;
    positionArr = positionArr.map(value => (value + (Math.random() - 0.5) * 0.2));
    let temVector = new THREE.Vector3();
    for(let i =0; i<positionArr.length; i+=3) {
        temVector.x = positionArr[i];
        temVector.y = positionArr[i+1];
        temVector.z = positionArr[i+2];
        temVector.normalize();
        positionArr[i] = temVector.x*r;
        positionArr[i+1] = temVector.y*r;
        positionArr[i+2] = temVector.z*r;
        randomParams[i+2] = Math.random()+0.03;
        randomParams[i+1] = (Math.random()*10-7)/10+0.2;
        randomParams[i] = (Math.random()*10-7)/10+0.2;
    }

    originSunPositions = Float32Array.from(positionArr)
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(positionArr, 3));
    pointGeometry.setAttribute('originSunPosition', new THREE.BufferAttribute(originSunPositions, 3));
    sunScales = new Float32Array(sunGeometry.attributes.position.array.length / 3).fill(2);

    pointGeometry.setAttribute('scale', new THREE.BufferAttribute(sunScales, 1));

    const pointMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0x98a3ed) },
        },
        vertexShader: document.getElementById('vertexshader')?.textContent || undefined,
        fragmentShader: document.getElementById('fragmentshader')?.textContent || undefined

    });
    sunPoints = new THREE.Points(pointGeometry, pointMaterial)
    sunPoints.name = 'sunPoints'
    sunPoints.position.copy(sun.position);


    glft.scene.remove(sun);
    glft.scene.add(sunPoints);
}


// 渲染流程
const init = () => {
  if (!detectWebgl()) return;
  const appContainer = document.querySelector('#render');
  if (!appContainer) return;
  const renderer = createRender();
  appContainer.appendChild(renderer.domElement);
  const scene = createScene();
  // 初始化相机
  let camera = createCamera();
  camera.position.set(0, 0, -35);

  //创建光源
  const lightA = new THREE.PointLight(0x7B8BD4, 4, 3.1);
  const lightB = new THREE.PointLight(0xFF9271, 0.1, 3.1);
  const lightC = new THREE.PointLight(0xFFE0DA, 4, 3.1);


  // 需要控制相机视角，可以放开注释
  // const controls = createOrbitControls(renderer, camera);

  // controls.addEventListener('change', () => {
  //   renderer.render(scene, camera);
  //   // console.log(camera.position);
  // })
  // 创建一个粗细为20的坐标轴
  // const axes = new THREE.AxesHelper(20)
  // scene.add(axes)

  // 加载模型文件
  new GLTFLoader().setPath('models/').load('myhome_export.gltf', (glft) => {
    console.log(glft);
    initSun(glft);

    // 加灯光
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

    // 使用模型中的相机替换当前相机
    const cameraObj = createCamera(glft.cameras[0] as THREE.PerspectiveCamera);
    cameraObj.aspect = renderConfig.RENDER_ASPECT;
    cameraObj.updateProjectionMatrix();
    window.addEventListener('resize', () => {
      cameraObj.aspect = renderConfig.RENDER_ASPECT;
      cameraObj.updateProjectionMatrix();
    });


    // 创建动画mixer 相机和椅子分开，动画要作用在相机对象上
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


    // 后期滤镜处理
    const renderScene = new RenderPass(scene, cameraObj);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(renderConfig.RENDER_WIDTH, renderConfig.RENDER_HEIGHT), 0.7, 0.2, 0.5);
    bloomPass.strength = 0.15;
    bloomPass.radius = 0.2;
    bloomPass.threshold = 0.8;
    const outputPass = new OutputPass();
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);

    // setTimeout(() => {
    //   const dist = 5.999 * 0.65;
    //   mixer.setTime(dist);
    //   cameraMixer.setTime(dist);
    //   moveSunPoints();
    //   composer.render();
    // }, 1000)

    // 粒子效果，内部计算逻辑可以写到shader中，暂时先写这里，性能尚可
    const moveSunPoints = () => {
      const cameraZ = cameraObj.position.z+10;
      const sunZ = sunPoints.position.z;
      const bollDis = 200;
      const baseDis = 78;
      const cameraY = 50; // 固定一个高度吧
      // if (dis > baseDis+1) return;
      // console.log('cameraObj-->', cameraObj.position.z, sunPoints.geometry.attributes.position, sunPoints);
      let positions = sunPoints.geometry.attributes.position;
      // console.log('cameraObj-->', cameraObj, positions, sunPoints.position)

      const arr = positions.array;
      for (let i = 0; i < arr.length; i += 3) {
        const pz = originSunPositions[i+2];
        const disZ = (sunZ+pz)-cameraZ;
        const disY = (sunPoints.position.y+originSunPositions[i+1])-cameraY;
        const dis = Math.sqrt(disZ*disZ + disY*disY);
        if (dis < baseDis ) {
          positions.array[i+2] = (originSunPositions[i+2] + bollDis*(baseDis-dis)/baseDis)*randomParams[i+2]*20;
          positions.array[i] = originSunPositions[i] + randomParams[i]*positions.array[i+2]*2; // 横向 x
          positions.array[i+1] = originSunPositions[i+1] + randomParams[i+1]*positions.array[i+2]*2; // 纵向 y
        } else {
          positions.array[i] = originSunPositions[i];
          positions.array[i+1] = originSunPositions[i+1];
          positions.array[i+2] = originSunPositions[i+2]; 
        }

        const itemScale = positions.array[i+2]/20;
        sunScales[i] =  itemScale>5 ? 5: (itemScale<1 ? 1 :itemScale);
        
      }
      pointGeometry.setAttribute('scale', new THREE.BufferAttribute(sunScales, 1));
      positions.needsUpdate = true;
    }

    ScrollSmoother.create({
      wrapper: '#app',
      content: '#content',
      smooth: 0.5,
      ignoreMobileResize: true,
      normalizeScroll: true,
      onUpdate: (self) => {
        moveSunPoints();
        mixer.setTime(5.999 * self.progress);
        cameraMixer.setTime(5.999 * self.progress);
        renderer.render(scene, cameraObj);
        composer.render();
      }
    })

    // const tl = gsap.timeline({
    //   scrollTrigger:{
    //     trigger:'.scene',
    //     scrub:true,
    //     pin:true,
    //     start: "top top",
    //     end: "+=100%",
    //   }
    // })

    gsap.from('#logo', { x: -999,duration:2 })

    gsap.utils.toArray('.scene').forEach((sceneEle) => {
      gsap.from((sceneEle as HTMLDivElement).querySelector('section'), {
        scrollTrigger: {
          trigger: sceneEle as HTMLDivElement,
          scrub: true,
          pin: true,
          start: "top top",
          end: "+=100%",
        },
        // x: -999,
        scale: 0.5,
        ease: 'power2'
      })
    })

    // 自动播放
    // const clocker = new THREE.Clock();
    // const animate = () => {
    //   requestAnimationFrame(animate);
    //   const delta = clocker.getDelta();
    //   mixer.update(delta);
    //   cameraMixer.update(delta);
    //   renderer.render(scene, cameraObj);
    //   composer.render(delta);
    // }
    // animate();
  })

}

init();