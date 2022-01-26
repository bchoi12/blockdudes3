var PlayerAction;
(function (PlayerAction) {
    PlayerAction["Idle"] = "Idle";
    PlayerAction["Walk"] = "Walk";
})(PlayerAction || (PlayerAction = {}));
class RenderPlayer extends RenderObject {
    constructor(mesh) {
        super(mesh);
        this._rotationOffset = -0.15;
        this._pointsMaterial = new THREE.PointsMaterial({ color: 0x000000, size: 0.2 });
        this._mixer = new THREE.AnimationMixer(mesh);
        this._actions = new Map();
        mesh.getObjectByName("mesh").rotation.y = Math.PI / 2 + this._rotationOffset;
        for (let action in PlayerAction) {
            const clip = this._mixer.clipAction(THREE.AnimationClip.findByName(mesh.animations, PlayerAction[action]));
            this.setWeight(clip, 1.0);
            clip.play();
            this._activeActions.add(action);
            this._actions.set(action, clip);
        }
        this.fadeOut(PlayerAction.Walk, 0);
        if (debugMode) {
            this._profileMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this._debugMaterial);
            this._mesh.add(this._profileMesh);
            const points = [];
            points.push(0, 0, 0);
            this._profilePoints = new THREE.BufferGeometry();
            this._profilePoints.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
            this._profilePointsMesh = new THREE.Points(this._profilePoints, this._pointsMaterial);
            this._mesh.add(this._profilePointsMesh);
        }
    }
    update(msg) {
        let pos = msg[posProp];
        let vel = msg[velProp];
        if (!defined(vel)) {
            vel = { X: 0, Y: 0 };
        }
        let acc = msg[accProp];
        if (!defined(acc)) {
            acc = { X: 0, Y: 0 };
        }
        let dir = msg[dirProp];
        let weaponDir = msg[weaponDirProp];
        this._mesh.position.x = pos.X;
        this._mesh.position.y = pos.Y;
        const player = this._mesh.getObjectByName("mesh");
        if (Math.abs(dir.X) > 0.2 && Math.sign(dir.X) != 0 && Math.sign(dir.X) != Math.sign(player.scale.z)) {
            player.scale.z *= -1;
            player.rotation.y = Math.PI / 2 + Math.sign(player.scale.z) * this._rotationOffset;
        }
        const neck = player.getObjectByName("neck");
        let angle = new THREE.Vector3(dir.X > 0 ? 1 : -1, 0, 0).angleTo(new THREE.Vector3(dir.X, dir.Y, 0));
        angle = normalize(angle) * -Math.sign(dir.Y);
        neck.rotation.x = angle;
        let armAngle = new THREE.Vector3(weaponDir.X > 0 ? 1 : -1, 0, 0).angleTo(new THREE.Vector3(weaponDir.X, weaponDir.Y, 0));
        armAngle = normalize(armAngle) * -Math.sign(weaponDir.Y);
        const arm = player.getObjectByName("armR");
        arm.rotation.x = armAngle - Math.PI / 2;
        if (Math.abs(vel.X) > 0.1 && Math.sign(vel.X) == Math.sign(acc.X)) {
            this.fadeTo(PlayerAction.Idle, PlayerAction.Walk, 1.0);
        }
        else {
            this.fadeTo(PlayerAction.Walk, PlayerAction.Idle, 0.4);
        }
        this.updateMixer();
        if (debugMode) {
            const profilePos = msg[profilePosProp];
            const profileDim = msg[profileDimProp];
            this._profileMesh.scale.x = profileDim.X;
            this._profileMesh.scale.y = profileDim.Y;
            if (msg.hasOwnProperty(profilePointsProp)) {
                const points = [];
                msg[profilePointsProp].forEach((point) => {
                    points.push(point.X - pos.X, point.Y - pos.Y, 0);
                });
                this._profilePoints.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
            }
        }
    }
}
