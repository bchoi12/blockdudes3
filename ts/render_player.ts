enum PlayerAction {
	Idle = "Idle",
	Walk = "Walk",
}

class RenderPlayer extends RenderObject {

	constructor(mesh : any) {
		super(mesh);
		this._mixer = new THREE.AnimationMixer(mesh);
		this._actions = new Map<PlayerAction, any>();

		for (let action in PlayerAction) {
			const clip = this._mixer.clipAction(THREE.AnimationClip.findByName(mesh.animations, PlayerAction[action]));
			this.setWeight(clip, 1.0);
			clip.play();
			this._activeActions.add(action);
			this._actions.set(action, clip);
		}
		this.fadeOut(PlayerAction.Walk, 0);
	}

	override update(msg : any) : void {
		const pos = msg[posProp]
		const vel = msg[velProp];
		const acc = msg[accProp];
		const dir = msg[dirProp];

		this._mesh.position.x = pos.X;
		this._mesh.position.y = pos.Y;

		if (Math.sign(dir.X) != 0 && Math.sign(dir.X) != Math.sign(this._mesh.scale.z)) {
			this._mesh.scale.z *= -1;
			this._mesh.rotation.y = Math.PI / 2 - Math.sign(this._mesh.scale.z) * 0.15;
		}

		const neck = this._mesh.getObjectByName("neck");
		let angle = new THREE.Vector3(dir.X > 0 ? 1 : -1, 0, 0).angleTo(new THREE.Vector3(dir.X, dir.Y, 0));
		angle = normalize(angle) * -Math.sign(dir.Y);
		if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) {
			angle = Math.PI / 4;
		} else if (angle < -Math.PI / 4 && angle > -3 * Math.PI / 4) {
			angle = -Math.PI / 4;
		}
		neck.rotation.x = angle;

		if (Math.abs(vel.X) > 0.1 && Math.sign(vel.X) == Math.sign(acc.X)) {
			this.fadeTo(PlayerAction.Idle, PlayerAction.Walk, 1.0);
		} else {
			this.fadeTo(PlayerAction.Walk, PlayerAction.Idle, 0.4);
		}

		// TODO: use actual framerate
		this._mixer.update(.017);
	}
}