import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CameraController } from './camera_controller.js';
import { SceneMap } from './scene_map.js';
import { HtmlUtil } from './util.js';
var Layer;
(function (Layer) {
    Layer[Layer["DEFAULT"] = 0] = "DEFAULT";
    Layer[Layer["BLOOM"] = 1] = "BLOOM";
})(Layer || (Layer = {}));
class Renderer {
    constructor() {
        this._rendererElm = "renderer";
        this._canvas = HtmlUtil.elm(this._rendererElm);
        this._sceneMap = new SceneMap();
        this._cameraController = new CameraController(this._canvas.offsetWidth / this._canvas.offsetHeight);
        this._renderer = new THREE.WebGLRenderer({ canvas: this._canvas, antialias: true });
        this._renderer.outputEncoding = THREE.sRGBEncoding;
        this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 0.5;
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const renderScene = new RenderPass(this._sceneMap.scene(), this._cameraController.camera());
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0.21;
        bloomPass.strength = 1.2;
        bloomPass.radius = 0.55;
        bloomPass.renderToScreen = true;
        this._composer = new EffectComposer(this._renderer);
        const size = new THREE.Vector2();
        this._renderer.getSize(size);
        this._composer.setSize(size.x, size.y);
        this._composer.addPass(renderScene);
        this._composer.addPass(bloomPass);
        this.resizeCanvas();
        window.onresize = () => { this.resizeCanvas(); };
        this._mousePixels = new THREE.Vector3(this._canvas.offsetWidth / 2, this._canvas.offsetHeight / 2, 0);
    }
    elm() { return this._canvas; }
    camera() { return this._cameraController; }
    sceneMap() { return this._sceneMap; }
    render() {
        this._sceneMap.updateComponents(this._cameraController.target());
        this._renderer.render(this._sceneMap.scene(), this._cameraController.camera());
    }
    setCamera(target) {
        this._cameraController.setTarget(target);
    }
    setMouseFromPixels(mouse) {
        this._mousePixels = mouse.clone();
    }
    getMouseScreen() {
        const mouse = this._mousePixels.clone();
        mouse.x -= window.innerWidth / 2;
        mouse.y -= window.innerHeight / 2;
        mouse.x /= window.innerWidth / 2;
        mouse.y /= -window.innerHeight / 2;
        return mouse;
    }
    getMouseWorld() {
        const mouse = this.getMouseScreen();
        const camera = this._cameraController.camera();
        mouse.unproject(camera);
        mouse.sub(camera.position).normalize();
        const distance = -camera.position.z / mouse.z;
        const mouseWorld = camera.position.clone();
        mouseWorld.add(mouse.multiplyScalar(distance));
        return mouseWorld;
    }
    resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this._renderer.setSize(width / 1.5, height / 1.5);
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._canvas.style.width = width + "px";
        this._canvas.style.height = height + "px";
        this._cameraController.setAspect(width / height);
    }
}
export const renderer = new Renderer();
