import * as THREE from 'three';

export class PrismGeometry extends THREE.ExtrudeGeometry {

	constructor(vertices: THREE.Vector2[], height : number) {
    	super(new THREE.Shape(vertices), {depth: height, bevelEnabled: false});
    }
}