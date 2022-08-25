import * as THREE from 'three';

import { PrismGeometry } from './prism_geometry.js'

export class WallBuilder {

	private _dim : THREE.Vector2;
	private _thickness : number;
	private _baseMaterial : THREE.Material;
	private _shape : THREE.Shape;

	constructor(dim : THREE.Vector2, thickness : number, baseMaterial : THREE.Material) {
		this._dim = dim;
		this._thickness = thickness;
		this._baseMaterial = baseMaterial;

		this._shape = new THREE.Shape([
			new THREE.Vector2(-dim.x/2, -dim.y/2),
			new THREE.Vector2(dim.x/2, -dim.y/2),
			new THREE.Vector2(dim.x/2, dim.y/2),
			new THREE.Vector2(-dim.x/2, dim.y/2),
		]);
	}

	addHole(hole : THREE.Path) {
		this._shape.holes.push(hole);
	}

	posFromPercent(x : number, y : number) : THREE.Vector2 {
		return new THREE.Vector2(
			-this._dim.x / 2 + this._thickness + x * (this._dim.x - 2 * this._thickness), 
			-this._dim.y / 2 + this._thickness + y * (this._dim.y - 2 * this._thickness));
	}

	build() : THREE.Mesh {
		return new THREE.Mesh(new PrismGeometry(this._shape, this._thickness), this._baseMaterial);
	}
}