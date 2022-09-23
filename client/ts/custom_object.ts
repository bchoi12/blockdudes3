import * as THREE from 'three'

import { Util } from './util.js'

export namespace CustomObject {
    export function nameSprite(text : string) {
        let fontFace = "Lato";
        let fontSize = 96;

        let canvas = document.createElement("canvas");
        let context = canvas.getContext('2d');

        context.font = fontSize + "px " + fontFace
        let metrics = context.measureText(text);

        const xScale = Math.max(1, metrics.width / context.canvas.width);
        context.canvas.width = 1.2 * metrics.width;
        context.canvas.height = 1.2 * fontSize;

        // Set this again because context sucks
        context.font = fontSize + "px " + fontFace

        context.fillStyle = "rgba(33, 33, 33, 0.1)";
        context.fillRect(0, 0, canvas.width, canvas.height);


        context.fillStyle = "rgba(233, 233, 233, 1.0)";
        context.fillText(text, 0.1 * context.canvas.width, 0.9 * fontSize);

        let texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;

        let spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.8 * xScale, 0.4, 1);
        return sprite;  
    }

    export function textSprite(text : string, color : number) {
        let fontFace = "Lato";
        let fontSize = 96;

        let canvas = document.createElement("canvas");
        let context = canvas.getContext('2d');

        context.font = fontSize + "px " + fontFace
        let metrics = context.measureText(text);

        const xScale = Math.max(1, metrics.width / context.canvas.width);
        context.canvas.width = 1.2 * metrics.width;
        context.canvas.height = 1.2 * fontSize;

        // Set this again because context sucks
        context.font = fontSize + "px " + fontFace

        context.fillStyle = color.toString(16);
        context.fillText(text, 0.1 * context.canvas.width, 0.9 * fontSize);

        let texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;

        let spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.8 * xScale, 0.4, 1);
        return sprite;          
    }
}