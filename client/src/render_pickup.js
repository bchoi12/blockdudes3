import { Model, loader } from './loader.js';
import { RenderObject } from './render_object.js';
export class RenderPickup extends RenderObject {
    constructor(space, id) {
        super(space, id);
    }
    initialize() {
        super.initialize();
        loader.load(Model.UZI, (mesh) => {
            this.setMesh(mesh);
        });
    }
    setMesh(mesh) {
        super.setMesh(mesh);
        mesh.receiveShadow = true;
    }
    update(msg, seqNum) {
        super.update(msg, seqNum);
        if (!this.hasMesh()) {
            return;
        }
        this.mesh().rotation.y += 0.01;
        this.mesh().rotation.x += 0.005;
    }
}
