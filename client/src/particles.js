import { SceneComponent } from './scene_component.js';
class Particles extends SceneComponent {
    constructor() {
        super();
        this._nextId = 1;
        this._particles = new Map();
    }
    add(particle, ttl) {
        const id = this.nextId();
        particle.onMeshLoad(() => {
            this._particles.set(id, particle);
            this._scene.add(particle.mesh());
            console.log("new particle " + id);
            setTimeout(() => {
                this._particles.delete(id);
                this._scene.remove(particle.mesh());
                console.log("particle gone " + id);
            }, ttl);
        });
    }
    update(position) {
        this._particles.forEach((particle, id) => {
            particle.updateParticle(position);
        });
    }
    nextId() {
        this._nextId++;
        return this._nextId - 1;
    }
}
export const particles = new Particles();
