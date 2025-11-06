// Name: Shaded
// ID: OACShaded
// Description: Sprite shaders for pen+
// By: ObviousAlexC <https://scratch.mit.edu/users/pinksheep2917/>
// License: MIT

(function (Scratch) {
    "use strict";

    const vm = Scratch.vm;
    const runtime = vm.runtime;
    const renderer = runtime.renderer;
    const gl = renderer._gl;
    const twgl = renderer.exports.twgl;
    const shaderManager = renderer._shaderManager;

    const vertex = `precision mediump float;

uniform mat4 u_projectionMatrix;
uniform mat4 u_modelMatrix;

attribute vec2 a_texCoord;
attribute vec2 a_position;

varying vec2 v_texCoord;

void main() {
	gl_Position = u_projectionMatrix * u_modelMatrix * vec4(a_position, 0, 1);
	v_texCoord = a_texCoord;
}`;

    const fragment = `precision mediump float;

uniform float u_color;
uniform float u_brightness;

uniform float u_fisheye;
uniform float u_whirl;
uniform float u_pixelate;
uniform vec2 u_skinSize;
uniform float u_mosaic;
uniform float u_ghost;
uniform float u_red;
uniform float u_green;
uniform float u_blue;

varying vec2 v_texCoord;

uniform sampler2D u_skin;

// Add this to divisors to prevent division by 0, which results in NaNs propagating through calculations.
// Smaller values can cause problems on some mobile devices.
const float epsilon = 1e-3;

// Branchless color conversions based on code from:
// http://www.chilliant.com/rgb2hsv.html by Ian Taylor
// Based in part on work by Sam Hocevar and Emil Persson
// See also: https://en.wikipedia.org/wiki/HSL_and_HSV#Formal_derivation


// Convert an RGB color to Hue, Saturation, and Value.
// All components of input and output are expected to be in the [0,1] range.
vec3 convertRGB2HSV(vec3 rgb)
{
	// Hue calculation has 3 cases, depending on which RGB component is largest, and one of those cases involves a "mod"
	// operation. In order to avoid that "mod" we split the M==R case in two: one for G<B and one for B>G. The B>G case
	// will be calculated in the negative and fed through abs() in the hue calculation at the end.
	// See also: https://en.wikipedia.org/wiki/HSL_and_HSV#Hue_and_chroma
	const vec4 hueOffsets = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);

	// temp1.xy = sort B & G (largest first)
	// temp1.z = the hue offset we'll use if it turns out that R is the largest component (M==R)
	// temp1.w = the hue offset we'll use if it turns out that R is not the largest component (M==G or M==B)
	vec4 temp1 = rgb.b > rgb.g ? vec4(rgb.bg, hueOffsets.wz) : vec4(rgb.gb, hueOffsets.xy);

	// temp2.x = the largest component of RGB ("M" / "Max")
	// temp2.yw = the smaller components of RGB, ordered for the hue calculation (not necessarily sorted by magnitude!)
	// temp2.z = the hue offset we'll use in the hue calculation
	vec4 temp2 = rgb.r > temp1.x ? vec4(rgb.r, temp1.yzx) : vec4(temp1.xyw, rgb.r);

	// m = the smallest component of RGB ("min")
	float m = min(temp2.y, temp2.w);

	// Chroma = M - m
	float C = temp2.x - m;

	// Value = M
	float V = temp2.x;

	return vec3(
		abs(temp2.z + (temp2.w - temp2.y) / (6.0 * C + epsilon)), // Hue
		C / (temp2.x + epsilon), // Saturation
		V); // Value
}

vec3 convertHue2RGB(float hue)
{
	float r = abs(hue * 6.0 - 3.0) - 1.0;
	float g = 2.0 - abs(hue * 6.0 - 2.0);
	float b = 2.0 - abs(hue * 6.0 - 4.0);
	return clamp(vec3(r, g, b), 0.0, 1.0);
}

vec3 convertHSV2RGB(vec3 hsv)
{
	vec3 rgb = convertHue2RGB(hsv.x);
	float c = hsv.z * hsv.y;
	return rgb * c + hsv.z - c;
}

const vec2 kCenter = vec2(0.5, 0.5);

void main()
{
	vec2 texcoord0 = v_texCoord;

    //Mosaic
	texcoord0 = fract(u_mosaic * texcoord0);
    if (u_pixelate > 0.0)
	{
		// TODO: clean up "pixel" edges
        vec2 pixelTexelSize = u_skinSize / u_pixelate;
        texcoord0 = (floor(texcoord0 * pixelTexelSize) + kCenter) / pixelTexelSize;
	}
    
    //Whirl
    if (u_whirl != 0.0)
	{
		const float kRadius = 0.5;
		vec2 offset = texcoord0 - kCenter;
		float offsetMagnitude = length(offset);
		float whirlFactor = max(1.0 - (offsetMagnitude / kRadius), 0.0);
		float whirlActual = u_whirl * whirlFactor * whirlFactor;
		float sinWhirl = sin(whirlActual);
		float cosWhirl = cos(whirlActual);
		mat2 rotationMatrix = mat2(
			cosWhirl, -sinWhirl,
			sinWhirl, cosWhirl
		);

		texcoord0 = rotationMatrix * offset + kCenter;
	}

    //Fisheye
    if (u_fisheye != 0.0)
	{
		vec2 vec = (texcoord0 - kCenter) / kCenter;
		float vecLength = length(vec);
		float r = pow(min(vecLength, 1.0), u_fisheye) * max(1.0, vecLength);
		vec2 unit = vec / vecLength;

		texcoord0 = kCenter + r * unit * kCenter;
	}

	gl_FragColor = texture2D(u_skin, texcoord0);

	// Divide premultiplied alpha values for proper color processing
	// Add epsilon to avoid dividing by 0 for fully transparent pixels
	gl_FragColor.rgb = clamp(gl_FragColor.rgb / (gl_FragColor.a + epsilon), 0.0, 1.0);

    gl_FragColor.rgb *= vec3(u_red / 100.0, u_green / 100.0, u_blue / 100.0);

    //Colour
    if (u_color != 0.0)
	{
		vec3 hsv = convertRGB2HSV(gl_FragColor.xyz);

		// this code forces grayscale values to be slightly saturated
		// so that some slight change of hue will be visible
		const float minLightness = 0.11 / 2.0;
		const float minSaturation = 0.09;
		if (hsv.z < minLightness) hsv = vec3(0.0, 1.0, minLightness);
		else if (hsv.y < minSaturation) hsv = vec3(0.0, minSaturation, hsv.z);

		hsv.x = mod(hsv.x + u_color, 1.0);
		if (hsv.x < 0.0) hsv.x += 1.0;

		gl_FragColor.rgb = convertHSV2RGB(hsv);
	}

    //Brightness
    gl_FragColor.rgb = clamp(gl_FragColor.rgb + vec3(u_brightness), vec3(0), vec3(1));

	// Re-multiply color values
	gl_FragColor.rgb *= gl_FragColor.a + epsilon;

	//Ghost
	gl_FragColor *= u_ghost;
}`;

  class extension {

    defaultEffects = {
        u_color: "color",
        u_fisheye: "fisheye",
        u_whirl: "whirl",
        u_pixelate: "pixelate",
        u_mosaic: "mosaic",
        u_brightness: "brightness",
        u_ghost: "ghost",
    }

    constructor() {
        this.newShader = twgl.createProgramInfo(gl, [
            //Scoot this in
            vertex,
            fragment
        ]);

        const oldGetShader = shaderManager.getShader;
        shaderManager.getShader = (mode, effectBits) => {
            if (mode != "default") return oldGetShader.call(shaderManager, mode, effectBits);
            else {
                return this.newShader;
            } 
        }

        vm.runtime.on("targetWasAdded", (clone) => {
            console.log(clone);
        });
    }

    getInfo() {
      return {
        blocks: [
            {
                blockType: Scratch.BlockType.COMMAND,
                text: "set [variable] effect to [value]",
                arguments: {
                    variable: { menu: "effects", defaultValue: "u_color" },
                    value: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                },
                opcode: "setNumberVar",
                extensions: ["colours_looks"],
            }
        ],

        menus: {
            effects: {
                items: [
                    {
                        text: "color",
                        value: "u_color"
                    },
                    {
                        text: "fisheye",
                        value: "u_fisheye"
                    },
                    {
                        text: "whirl",
                        value: "u_whirl"
                    },
                    {
                        text: "pixelate",
                        value: "u_pixelate"
                    },
                    {
                        text: "mosaic",
                        value: "u_mosaic"
                    },
                    {
                        text: "brightness",
                        value: "u_brightness"
                    },
                    {
                        text: "ghost",
                        value: "u_ghost"
                    },
                    {
                        text: "red amount",
                        value: "u_red"
                    },
                    {
                        text: "green amount",
                        value: "u_green"
                    },
                    {
                        text: "blue amount",
                        value: "u_blue"
                    }
                ],
                acceptReporters: true
            },
            boolean: {
                items: [ "true", "false" ],
                acceptReporters: true
            }
        },

        name: "Effective",
        id: "OACEffective",

        color1: "#9966FF",
        color2: "#855CD6",
        color3: "#774DCB",
      };
    }

    setNumberVar({ variable, value }, { target }) {
        if (this.defaultEffects[variable]) target.setEffect(this.defaultEffects[variable], Scratch.Cast.toNumber(value));
        else {
            renderer._allDrawables[target.drawableID]._uniforms[variable] = Scratch.Cast.toNumber(value);
            vm.renderer.dirty = true;
        }
    }
  }

  Scratch.extensions.register(new extension());
})(Scratch);
