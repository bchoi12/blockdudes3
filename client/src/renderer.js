import * as THREE from 'three';
import { CameraController } from './camera_controller.js';
import { game } from './game.js';
import { HtmlUtil } from './util.js';
import { options } from './options.js';
class Renderer {
    constructor() {
        this._elmRenderer = "canvas-game";
        this._canvas = HtmlUtil.elm(this._elmRenderer);
        this._cameraController = new CameraController(this._canvas.offsetWidth / this._canvas.offsetHeight);
        this._renderer = new THREE.WebGLRenderer({ canvas: this._canvas, antialias: true });
        this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.0;
        if (options.enableShadows) {
            this._renderer.shadowMap.enabled = true;
            this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        this.resizeCanvas();
        window.onresize = () => { this.resizeCanvas(); };
        this._mousePixels = new THREE.Vector2(this._canvas.offsetWidth / 2, this._canvas.offsetHeight / 2);
    }
    elm() { return this._canvas; }
    compile(mesh) {
        this._renderer.compile(mesh, this._cameraController.camera());
    }
    render() {
        this._renderer.render(game.sceneMap().scene(), this._cameraController.camera());
    }
    cameraTarget() {
        return this._cameraController.target();
    }
    setCameraTarget(target) {
        this._cameraController.setTarget(target);
    }
    setMouseFromPixels(mouse) {
        this._mousePixels = mouse.clone();
    }
    playSound(sound, pos) {
        let dist = new THREE.Vector2(pos.x - this._cameraController.target().x, pos.y - this._cameraController.target().y);
        if (dist.lengthSq() <= 50) {
            sound.volume(1);
        }
        else {
            sound.volume(50 / dist.lengthSq());
        }
        sound.stereo(Math.min(1, Math.max(-1, dist.x / 10)));
        sound.play();
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
        const mouseScreen = this.getMouseScreen();
        const mouse = new THREE.Vector3(mouseScreen.x, mouseScreen.y, 0);
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
