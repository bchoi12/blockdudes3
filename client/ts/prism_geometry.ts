import * as THREE from 'three';

export class PrismGeometry extends THREE.ExtrudeGeometry {
    constructor(shape : THREE.Shape, options : Object) {
    	super(shape, options);
    }
}