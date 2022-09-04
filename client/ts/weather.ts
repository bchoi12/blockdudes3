import * as THREE from 'three';

import { options } from './options.js'
import { RenderCustom } from './render_custom.js'
import { renderer } from './renderer.js'
import { RingBuffer } from './ring_buffer.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'
import { MathUtil, Util } from './util.js'

export class Weather extends SceneComponent {
	private readonly _cloudMaterial = new THREE.MeshLambertMaterial({
		color: 0xebebeb,
	});

	private readonly _cloudLength = 4.5;
	private readonly _cloudHeight = 0.3;
	private readonly _cloudDepth = 2.5;

	private readonly _cloudYs = new RingBuffer([6, 10, 14, 18]);
	private readonly _cloudZs = new RingBuffer([-18, -15, -12, -9, 9, 10]);

	private _cloudMesh : THREE.InstancedMesh;
	private _cloudObject : RenderCustom;

	constructor() {
		super();

		this._cloudYs.setShuffle(true);
		this._cloudZs.setShuffle(true);

		const space = 12;
		const start = -40;
		const numClouds = 40;
		const end = start + numClouds * space

		this._cloudMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(
			this._cloudLength,
			this._cloudHeight,
			this._cloudDepth), this._cloudMaterial, numClouds);

		this._cloudMesh.castShadow = options.enableShadows;

		for (let i = 0; i < numClouds; ++i) {
			let matrix = new THREE.Matrix4();
			this._cloudMesh.getMatrixAt(i, matrix);
			matrix.makeTranslation(
				Math.floor(i/2) * space + start + MathUtil.randomRange(-2, 2),
				(i % 2 === 0 ? 16 : 0) + this._cloudYs.getNext() + MathUtil.randomRange(-1, 1),
				this._cloudZs.getNext());
			this._cloudMesh.setMatrixAt(i, matrix);
		}
		this._cloudMesh.instanceMatrix.needsUpdate = true;

		this._cloudObject = new RenderCustom(this.nextId());
		this._cloudObject.setMesh(this._cloudMesh);
		this._cloudObject.setUpdate((mesh : THREE.Object3D, ts : number) => {
			mesh.position.x += 0.6 * ts;

			for (let i = 0; i < numClouds; ++i) {
				let matrix = new THREE.Matrix4();
				this._cloudMesh.getMatrixAt(i, matrix);

				const x = mesh.position.x + matrix.elements[12];
				if (x > end) {
					matrix.setPosition(x - (end - start), this._cloudYs.getNext(), this._cloudZs.getNext());
					this._cloudMesh.setMatrixAt(i, matrix);
					this._cloudMesh.instanceMatrix.needsUpdate = true;
				}
			}
		});
		this.addCustom(this._cloudObject);

/*
		while (x <= end) {
			const speed = MathUtil.randomRange(0.8, 1);

			const updateCloud = (ts : number) => {
				cloud.mesh().position.x += speed * ts;
				if (cloud.mesh().position.x > end) {
					cloud.mesh().position.x = start;
				}
			};

			x += MathUtil.randomRange(10, 12);
		}

		for (let x = -5; x < 80; ) {
			let cloud = new RenderCustom();
			cloud.setMesh(this.newCloudMesh(x));

			cloud.setUpdate(updateCloud); 
			this.addCustom(cloud);
		}
		*/
	}
}