import * as THREE from 'three'

import { Util } from './util.js'

export namespace SpriteCreator {
    export function text(text : string, options : SpriteTextOptions) : THREE.Sprite {
        let fontFace = options.fontFace;
        let fontSize = options.fontSize;

        let canvas = document.createElement("canvas");
        let context = canvas.getContext('2d');

        let style = fontSize + "px " + fontFace;
        if (options.style) {
            style += " " + options.style;
        }
        context.font = style
        let metrics = context.measureText(text);

        let xScale = metrics.width / context.canvas.width;
        if (options.restrictWidth) {
            xScale = Math.max(1, xScale);
        }
        let buffer = options.buffer ? options.buffer : 0;
        context.canvas.width = (1 + 2 * buffer) * metrics.width;
        context.canvas.height = (1 + 2 * buffer) * fontSize;

        // Set this again because context sucks
        context.font = style;

        if (options.background) {
            context.fillStyle = options.background;   
            context.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (options.color) {
            context.fillStyle = options.color;            
        }
        if (options.shadow) {
            context.shadowColor = options.shadow;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            context.shadowBlur = options.shadowBlur ? options.shadowBlur : 0;
        }
        context.fillText(text, buffer * context.canvas.width, (1 - buffer) * fontSize);

        let texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;

        let spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set((1 - 2 * buffer) * xScale, 0.5 * (1 - 2 * buffer), 1);
        return sprite;  
    }
}

export interface SpriteTextOptions {
    fontFace : string;
    fontSize : number;

    buffer? : number;
    restrictWidth? : boolean;
    background? : string;
    style? : string;
    padding? : number;
    color? : string;
    shadow? : string;
    shadowBlur? : number;
}