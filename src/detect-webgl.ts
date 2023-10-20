import WebGL from "three/examples/jsm/capabilities/WebGL.js";

export const detectWebgl = () => {
  if (!WebGL.isWebGLAvailable()) {
    const appEle = document.querySelector<HTMLDivElement>('#app');
    if (appEle) appEle.style.display = 'none';
    const tipEle = document.querySelector<HTMLDivElement>('#unsupportedTip');
    if (tipEle) tipEle.style.display = 'flex';
    return false;
  }
  return true;
}