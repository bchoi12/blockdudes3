import * as THREE from 'three';

export enum WallShape {
	UNKNOWN = 0,
	SQUARE = 1,
	OCTAGONAL = 2,
}

export class WallBuilder {
	private readonly _tableShapes = new Map<WallShape, THREE.Shape>([
		[
			WallShape.SQUARE, new THREE.Shape([
				new THREE.Vector2(-0.5, -0.5),
				new THREE.Vector2(0.5, -0.5),
				new THREE.Vector2(0.5, 0.5),
				new THREE.Vector2(-0.5, 0.5),
			])
		],
		[
			WallShape.OCTAGONAL, new THREE.Shape([
				new THREE.Vector2(-0.4, -0.5),
				new THREE.Vector2(0.4, -0.5),
				new THREE.Vector2(0.5, -0.4),
				new THREE.Vector2(0.5, 0.4),
				new THREE.Vector2(0.4, 0.5),
				new THREE.Vector2(-0.4, 0.5),
				new THREE.Vector2(-0.5, 0.4),
				new THREE.Vector2(-0.5, -0.4),
			])
		],
	]);

	private _mesh : THREE.Mesh;

	constructor(type : WallShape, dim : THREE.Vector3, material : THREE.Material) {
		const thickness = 0.8 * dim.y;
		let geometry = new THREE.ExtrudeGeometry(this._tableShapes.get(type), {
			depth: dim.y - thickness,
			bevelEnabled: true,
			bevelThickness: thickness / 2,
			bevelSize: thickness / 4,
		});
		geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, - (dim.y - thickness) / 2));

		/*
		let geometry = new THREE.ExtrudeGeometry(this._tableShapes.get(type), {
			depth: dim.y - 0.16,
			bevelEnabled: true,
			bevelThickness: 0.08,
			bevelSize: 0.04,
		});
		geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, - (dim.y - 0.16) / 2));
		*/

		this._mesh = new THREE.Mesh(geometry, material);

		this._mesh.scale.x = dim.x;
		this._mesh.scale.y = dim.z;
		this._mesh.rotation.x = Math.PI / 2;
	}

	build() : THREE.Mesh {
		return this._mesh;
	}
}