import * as THREE from 'three';

export class PrismGeometry extends THREE.ExtrudeGeometry {
    constructor(shape : THREE.Shape, depth : number) {
    	super(shape, { depth: depth, bevelEnabled: false });
    }
}