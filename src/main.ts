import * as THREE from 'three';
// import { detectWebgl } from './detect-webgl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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

// const createOrbitControls = (render: THREE.WebGLRenderer, camera: THREE.Camera) => {
//   const controls = new OrbitControls(camera, render.domElement);
//   controls.enableDamping = true;
//   controls.minDistance = 0;
//   controls.maxDistance = 3000;
//   return controls;
// }

let sun, sunGeometry, pointGeometry: THREE.BufferGeometry, sunScales: Float32Array, sunPoints: THREE.Points, positionArr, originSunPositions: Float32Array, randomParams: Array<any> = [];

const initSun = (obj:THREE.Object3D) => {
  // 太阳
  sun = obj.getObjectByName('sun') as THREE.Mesh;

  const r = 3;
  sunGeometry = new THREE.SphereGeometry(r, 100, 100);
  sunGeometry.name = 'sunGeometry';
  console.log('sun-->', sun)

  pointGeometry = new THREE.BufferGeometry();
  positionArr = sunGeometry.attributes.position.array;
  positionArr = positionArr.map(value => (value + (Math.random() - 0.5) * 0.2));
  let temVector = new THREE.Vector3();
  for (let i = 0; i < positionArr.length; i += 3) {
    temVector.x = positionArr[i];
    temVector.y = positionArr[i + 1];
    temVector.z = positionArr[i + 2];
    temVector.normalize();
    positionArr[i] = temVector.x * r;
    positionArr[i + 1] = temVector.y * r;
    positionArr[i + 2] = temVector.z * r;
    randomParams[i + 2] = Math.random() + 0.03;
    randomParams[i + 1] = Math.random() - 0.8;
    randomParams[i] = (Math.random() * 10 - 7) / 10 + 0.2;
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
  sunPoints.rotateX(-90);

  obj.remove(sun);
  obj.add(sunPoints);
}


// 渲染流程
const init = () => {
  // if (!detectWebgl()) return;
  const appContainer = document.querySelector<HTMLDivElement>('#render');
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
  new GLTFLoader().setPath('models/').load('myhome_camFixed.gltf', (glft) => {
    console.log(glft);

    // 房屋
    const house = glft.scene.getObjectByName('house') as THREE.Mesh;
    // 加灯光
    const light1 = house.getObjectByName('lightProxy_01') as THREE.Mesh;
    lightA.position.copy(light1.position);
    house.remove(light1);
    house.add(lightA);

    const light2 = house.getObjectByName('lightProxy_02') as THREE.Mesh;
    lightB.position.copy(light2.position);
    house.remove(light2);
    house.add(lightB);

    const light3 = house.getObjectByName('lightProxy_03') as THREE.Mesh;
    lightC.position.copy(light3.position);
    house.remove(light3);
    house.add(lightC);

    //更新太阳
    initSun(house);

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
    if (glft.animations.length > 0) {
      mixer = new THREE.AnimationMixer(glft.scene);
      mixer.clipAction(glft.animations[0]).play();
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
    //   const dist = 5.999 * 0.58;
    //   mixer.setTime(dist);
    //   // cameraMixer.setTime(dist);
    //   moveSunPoints();
    //   composer.render();
    // }, 1000)

    // 粒子效果，内部计算逻辑可以写到shader中，暂时先写这里，性能尚可
    const moveSunPoints = () => {
      const cameraZ = house.position.z;
      const sunZ = 80;
      const bollDis = 200;
      const baseDis = 85;
      const cameraY = 70; // 固定一个高度吧

      // console.log('house-->',house.position.y, house.position.z, sunPoints.geometry.attributes.position, sunPoints);
      // console.log('house-->', house.position.z, sunPoints.geometry.attributes.position, sunPoints);
      let positions = sunPoints.geometry.attributes.position;

      const arr = positions.array;
      for (let i = 0; i < arr.length; i += 3) {
        const pz = originSunPositions[i + 2];
        const disZ = (sunZ + pz) + cameraZ;
        const disY = originSunPositions[i + 1] - cameraY;
        const dis = Math.sqrt(disZ * disZ + disY * disY);
        if (dis < baseDis) {
          const target = (originSunPositions[i + 2] + bollDis * (baseDis - dis) / baseDis);
          positions.array[i + 2] = target > 0 ? target * randomParams[i + 2] * 10 : target;
          positions.array[i] = originSunPositions[i] + randomParams[i] * positions.array[i + 2] * 3; // 横向 x
          positions.array[i + 1] = originSunPositions[i + 1] + randomParams[i + 1] * positions.array[i + 2] * 3; // 纵向 y
        } else {
          positions.array[i] = originSunPositions[i];
          positions.array[i + 1] = originSunPositions[i + 1];
          positions.array[i + 2] = originSunPositions[i + 2];
        }

        const itemScale = positions.array[i + 2] / 5;
        sunScales[i] = itemScale > 5 ? 5 : (itemScale < 1 ? 1 : itemScale);

      }
      pointGeometry.setAttribute('scale', new THREE.BufferAttribute(sunScales, 1));
      positions.needsUpdate = true;
    }
    let mouseX: number = 0;
    let mouseY: number = 0;
    const onMouseMove = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      mouseX = (event.clientX - renderConfig.RENDER_WIDTH / 2) * 2 / renderConfig.RENDER_WIDTH;
      mouseY = (event.clientY - renderConfig.RENDER_HEIGHT / 2) * 2 / renderConfig.RENDER_WIDTH;
      // mouseX = Math.abs(mouseX) >= 0.5 ? mouseX : 0;
      // mouseY = Math.abs(mouseY) >= 0.3 ? mouseY : 0;
      // console.log(mouseX, mouseY);
    }
    window.addEventListener('pointermove', onMouseMove, false);

    // 自动播放
    // const clocker = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      // cameraObj.position.x += (mouseX - cameraObj.position.x) * .0005;
      // cameraObj.position.y += (- mouseY - cameraObj.position.y) * .0005;
      // cameraObj.position.x = mouseX > 0 ? 5 : -5;
      // console.log(cameraObj.position);
      // const targetPos = glft.scene.position.clone();
      // targetPos.x = glft.scene.position.x + mouseX * 5;
      // console.log(Math.sign(mouseX) * 0.5 / Math.pow(1.1, mouseX * 100));
      // cameraObj.position.x += Math.sign(mouseX) * 0.0005 / Math.pow(1.1, mouseX * 100);
      // cameraObj.position.y += -Math.sign(mouseY) * 0.0005 / Math.pow(1.1, mouseY * 100)
      cameraObj.lookAt(0, 1.6589, -6.4);
      renderer.render(scene, cameraObj);
      composer.render();
    }
    animate();


    // 滚轴动画
    ScrollSmoother.create({
      wrapper: '#app',
      content: '#content',
      smooth: 0.5,
      ignoreMobileResize: true,
      normalizeScroll: true,
      onUpdate: (self) => {
        moveSunPoints();
        // console.log(self.progress);
        mixer.setTime(5.999 * self.progress);
        renderer.render(scene, cameraObj);
        composer.render();
      }
    })

    gsap.from('#logo', { x: -999, duration: 2 })

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

  })

}

init();