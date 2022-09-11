import * as THREE from 'three';

import { options } from './options.js'
import { RenderCustom } from './render_custom.js'
import { renderer } from './renderer.js'
import { RingBuffer } from './ring_buffer.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'
import { MathUtil, Util } from './util.js'

// TODO: rename to Decoration
export class Weather extends SceneComponent {
	private readonly _cloudMaterial = new THREE.MeshLambertMaterial({
		color: 0xebebeb,
	});

	private readonly _cloudLengths = new RingBuffer([3, 4, 5, 6]);
	private readonly _cloudHeights = new RingBuffer([0.25, 0.33, 0.4]);
	private readonly _cloudDepths = new RingBuffer([2, 2.5, 3]);

	private readonly _cloudYs = new RingBuffer([6, 10, 14, 18]);
	private readonly _cloudZs = new RingBuffer([-18, -15, -12, -9, 9, 10]);

	private readonly _cloudColors = new RingBuffer<THREE.Color>([
		new THREE.Color(0xfbfbfb),
		new THREE.Color(0xfbfbfb),
		new THREE.Color(0xebebeb),
		new THREE.Color(0xebebeb),
		new THREE.Color(0xcbcbcb),
	]);

	private _cloudMesh : THREE.InstancedMesh;
	private _cloudObject : RenderCustom;

	constructor() {
		super();

		this._cloudLengths.setShuffle(true);
		this._cloudHeights.setShuffle(true);
		this._cloudDepths.setShuffle(true);
		this._cloudYs.setShuffle(true);
		this._cloudZs.setShuffle(true);
		this._cloudColors.setShuffle(true);

		const space = 16;
		const vertical = 20;
		const levels = 2;
		const start = -40;
		const numClouds = 40;
		const end = start + numClouds * space / levels;

		this._cloudMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), this._cloudMaterial, numClouds);

		this._cloudMesh.castShadow = options.enableShadows;

		for (let i = 0; i < numClouds; ++i) {
			let matrix = new THREE.Matrix4();
			this._cloudMesh.getMatrixAt(i, matrix);
			matrix.makeScale(
				this._cloudLengths.getNext(),
				this._cloudHeights.getNext(),
				this._cloudDepths.getNext());
			matrix.setPosition(
				start + i / levels * space + MathUtil.randomRange(-3, 3),
				(vertical * (i % levels)) + this._cloudYs.getNext() + MathUtil.randomRange(-1.5, 1.5),
				this._cloudZs.getNext());
			this._cloudMesh.setMatrixAt(i, matrix);

			this._cloudMesh.setColorAt(i, this._cloudColors.getNext());
		}
		this._cloudMesh.instanceMatrix.needsUpdate = true;
		this._cloudMesh.instanceColor.needsUpdate = true;

		this._cloudObject = new RenderCustom(this.nextId());
		this._cloudObject.setMesh(this._cloudMesh);
		this._cloudObject.setUpdate((mesh : THREE.Object3D, ts : number) => {
			mesh.position.x += 0.6 * ts;

			for (let i = 0; i < numClouds; ++i) {
				let matrix = new THREE.Matrix4();
				this._cloudMesh.getMatrixAt(i, matrix);

				const x = mesh.position.x + matrix.elements[12];

				if (x > end) {
					matrix.setPosition(start - mesh.position.x, this._cloudYs.getNext(), this._cloudZs.getNext());
					this._cloudMesh.setMatrixAt(i, matrix);
					this._cloudMesh.instanceMatrix.needsUpdate = true;
				}
			}
		});
		this.addCustom(this._cloudObject);
	}
}