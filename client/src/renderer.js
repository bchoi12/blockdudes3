import * as THREE from 'three';
import { CameraController } from './camera_controller.js';
import { SceneMap } from './scene_map.js';
import { HtmlUtil } from './util.js';
import { options } from './options.js';
class Renderer {
    constructor() {
        this._rendererElm = "renderer";
        this._canvas = HtmlUtil.elm(this._rendererElm);
        this._sceneMap = new SceneMap();
        this._cameraController = new CameraController(this._canvas.offsetWidth / this._canvas.offsetHeight);
        this._renderer = new THREE.WebGLRenderer({ canvas: this._canvas, antialias: true });
        this._renderer.autoClear = false;
        this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.0;
        if (options.enableShadows) {
            this._renderer.shadowMap.enabled = true;
            this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        this.resizeCanvas();
        window.onresize = () => { this.resizeCanvas(); };
        this._mousePixels = new THREE.Vector3(this._canvas.offsetWidth / 2, this._canvas.offsetHeight / 2, 0);
    }
    elm() { return this._canvas; }
    sceneMap() { return this._sceneMap; }
    compile(mesh) {
        this._renderer.compile(mesh, this._cameraController.camera());
    }
    render() {
        this._renderer.clear();
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
        this._renderer.setSize(width * options.rendererScale, height * options.rendererScale);
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._canvas.style.width = width + "px";
        this._canvas.style.height = height + "px";
        this._cameraController.setAspect(width / height);
    }
}
export const renderer = new Renderer();
