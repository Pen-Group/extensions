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

uniform float u_skewX;
uniform float u_skewY;

attribute vec2 a_texCoord;
attribute vec2 a_position;

varying vec2 v_texCoord;

void main() {
	gl_Position = u_projectionMatrix * u_modelMatrix * (mat4(
        1, u_skewY / 100.0, 0, 0,
        u_skewX / 100.0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ) * vec4(a_position, 0, 1));
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

uniform float u_waveAmpX;
uniform float u_waveAmpY;
uniform float u_waveSizeX;
uniform float u_waveSizeY;
uniform float u_waveProgress;

uniform float u_saturation;
uniform float u_sepia;

uniform float u_red_e;
uniform float u_green_e;
uniform float u_blue_e;

uniform float u_unfocus;
uniform lowp int u_blur;

uniform bool u_oldColor;
uniform bool u_repeat;

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

    if (u_waveAmpX != 0.0) {
        texcoord0.x += sin(u_waveProgress + texcoord0.x * u_waveSizeX) * u_waveAmpX;
    }

    if (u_waveAmpY != 0.0) {
        texcoord0.y += sin(u_waveProgress + texcoord0.y * u_waveSizeY) * u_waveAmpY;
    }

    if (!u_repeat && (texcoord0.x < 0.0 || texcoord0.y < 0.0 || texcoord0.x > 1.0 || texcoord0.y > 1.0)) { discard; }

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

    if (u_unfocus > 0.0) {
        float blurDist =  u_unfocus / 1000.0;
        for (int i = 0; i<4; i++) {
            float curDist = blurDist * float(i);
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(0, curDist));
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(0, -curDist));
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(curDist, 0));
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(-curDist, 0));


            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(curDist, curDist));
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(curDist, -curDist));
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(-curDist, -curDist));
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(-curDist, curDist));
        }

        gl_FragColor /= 33.0;
    }

    if (u_blur > 0) {
        vec2 pixelTexelSize = 1.0 / u_skinSize;
        float divider = 1.0;
        float unfocused = 1.0;
        if (u_unfocus > 0.0) {
            unfocused = 1.0 / u_unfocus;
        }

        float dividerStep = 8.0 * unfocused;

        for (int i = 0; i<128; i++) {
            if (i >= u_blur) { break; }

            vec2 blurStep = pixelTexelSize * float(i);

            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(0, blurStep.y)) * unfocused;
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(0, -blurStep.y)) * unfocused;
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(blurStep.x, 0)) * unfocused;
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(-blurStep.x, 0)) * unfocused;


            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(blurStep.x, blurStep.y)) * unfocused;
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(blurStep.x, -blurStep.y)) * unfocused;
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(-blurStep.x, -blurStep.y)) * unfocused;
            gl_FragColor += texture2D(u_skin, texcoord0 + vec2(-blurStep.x, blurStep.y)) * unfocused;

            divider += dividerStep;
        }

        gl_FragColor /= divider;
    }
    
	// Divide premultiplied alpha values for proper color processing
	// Add epsilon to avoid dividing by 0 for fully transparent pixels
	gl_FragColor.rgb = clamp(gl_FragColor.rgb / (gl_FragColor.a + epsilon), 0.0, 1.0);

    gl_FragColor.rgb *= vec3(u_red_e / 100.0, u_green_e / 100.0, u_blue_e / 100.0);

    //Colour
    if (u_color != 0.0)
	{
		vec3 hsv = convertRGB2HSV(gl_FragColor.xyz);

		// this code forces grayscale values to be slightly saturated
		// so that some slight change of hue will be visible
        if (u_oldColor) {
            const float minLightness = 0.11 / 2.0;
            const float minSaturation = 0.09;
            if (hsv.z < minLightness) hsv = vec3(0.0, 1.0, minLightness);
            else if (hsv.y < minSaturation) hsv = vec3(0.0, minSaturation, hsv.z);
        }

		hsv.x = mod(hsv.x + u_color, 1.0);
		if (hsv.x < 0.0) hsv.x += 1.0;

		gl_FragColor.rgb = convertHSV2RGB(hsv);
	}

    //Saturation
    if (u_saturation != 0.0) {
		vec3 hsv = convertRGB2HSV(gl_FragColor.xyz);
        hsv.y += u_saturation / 100.0;
		gl_FragColor.rgb = convertHSV2RGB(hsv);
    }

    //Brightness
    if (u_oldColor) {
        gl_FragColor.rgb = clamp(gl_FragColor.rgb + vec3(u_brightness), vec3(0), vec3(1));
    }
    else {
		vec3 hsv = convertRGB2HSV(gl_FragColor.xyz);
        hsv.z += u_brightness;
		gl_FragColor.rgb = convertHSV2RGB(hsv);
    }

    if (u_sepia >= 0.0) {
        float brightest = gl_FragColor.x;
        if (gl_FragColor.y > brightest) { brightest = gl_FragColor.y; }
        if (gl_FragColor.z > brightest) { brightest = gl_FragColor.z; }

        gl_FragColor.xyz = mix(gl_FragColor.xyz, vec3(brightest, brightest * 0.75, brightest * 0.5), u_sepia / 100.0);
    }

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

    defaultValues = {
        u_saturation: 0,
        u_red_e: 100,
        u_green_e: 100,
        u_blue_e: 100,

        u_waveAmpX: 0,
        u_waveAmpY: 0,
        u_waveSizeX: 3.1415962,
        u_waveSizeY: 3.1415962,
        u_waveProgress: 0,

        u_blur: 0,
        u_unfocus: 0,
        
        u_skewX: 0,
        u_skewY: 0,

        u_oldColor: true,
        u_repeat: false
    }

    maxRanges = {
        u_saturation: [-100, 100],
        u_red_e: [0, 100],
        u_green_e: [0, 100],
        u_blue_e: [0, 100],
        
        u_waveAmpX: [-1, 1],
        u_waveAmpY: [-1, 1],
        u_waveSizeX: [-6.28318, 6.28318],
        u_waveSizeY: [-6.28318, 6.28318],
        u_waveProgress: [-Infinity, Infinity],
        
        u_blur: [0, 128],
        u_unfocus: [0, 100],
        
        u_skewX: [-1, 1],
        u_skewY: [-1, 1],
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

        runtime.on("targetWasCreated", (target) => {
            if (target.isOriginal) {
                renderer._allDrawables[target.drawableID]._uniforms = {
                    ...renderer._allDrawables[target.drawableID]._uniforms,
                    ...this.defaultValues
                }
            }
            else {
                renderer._allDrawables[target.drawableID]._uniforms = {...renderer._allDrawables[target.sprite.clones[0].drawableID]._uniforms};
            }
        });

        //Load default values
        for (let targetID in runtime.targets) {
            const target = runtime.targets[targetID];

            renderer._allDrawables[target.drawableID]._uniforms = {...renderer._allDrawables[target.sprite.clones[0].drawableID]._uniforms, ...this.defaultValues};
        }
    }

    getInfo() {
      return {
        blocks: [
            {
                blockType: Scratch.BlockType.COMMAND,
                text: "change [variable] effect by [value]",
                arguments: {
                    variable: { menu: "effects", defaultValue: "u_color" },
                    value: { type: Scratch.ArgumentType.NUMBER, defaultValue: 25 }
                },
                opcode: "changeNumberVar",
                extensions: ["colours_looks"],
            },
            {
                blockType: Scratch.BlockType.COMMAND,
                text: "set [variable] effect to [value]",
                arguments: {
                    variable: { menu: "effects", defaultValue: "u_color" },
                    value: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                },
                opcode: "setNumberVar",
                extensions: ["colours_looks"],
            },
            "---",
            {
                blockType: Scratch.BlockType.COMMAND,
                text: "set [variable] effect to [value]",
                arguments: {
                    variable: { menu: "options", defaultValue: "u_oldColor" },
                    value: { menu: "boolean", defaultValue: "true" }
                },
                opcode: "setOption",
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
                        text: "saturation",
                        value: "u_saturation"
                    },
                    {
                        text: "brightness",
                        value: "u_brightness"
                    },
                    {
                        text: "sepia",
                        value: "u_sepia"
                    },
                    {
                        text: "red amount",
                        value: "u_red_e"
                    },
                    {
                        text: "green amount",
                        value: "u_green_e"
                    },
                    {
                        text: "blue amount",
                        value: "u_blue_e"
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
                        text: "wave amplitude x",
                        value: "u_waveAmpX"
                    },
                    {
                        text: "wave amplitude y",
                        value: "u_waveAmpY"
                    },
                    {
                        text: "wave size x",
                        value: "u_waveSizeX"
                    },
                    {
                        text: "wave size y",
                        value: "u_waveSizeY"
                    },
                    {
                        text: "wave offset",
                        value: "u_waveProgress"
                    },
                    {
                        text: "ghost",
                        value: "u_ghost"
                    },
                    {
                        text: "blur",
                        value: "u_blur"
                    },
                    {
                        text: "unfocus",
                        value: "u_unfocus"
                    },
                    {
                        text: "skew x",
                        value: "u_skewX"
                    },
                    {
                        text: "skew y",
                        value: "u_skewY"
                    }
                ],
                acceptReporters: true
            },
            options: {
                items: [
                    { text: "use old color functions", value: "u_oldColor" },
                    { text: "repeat costumes", value: "u_repeat" }
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
        const defaultEffect = this.defaultEffects[variable];
        if (defaultEffect) target.setEffect(defaultEffect, Scratch.Cast.toNumber(value));
        else if (typeof this.defaultValues[variable] == "boolean") return;
        else {
            const drawable = renderer._allDrawables[target.drawableID];
            drawable._uniforms[variable] = Scratch.Cast.toNumber(value);

            //Clamp to limits
            if (runtime.runtimeOptions.miscLimits) drawable._uniforms[variable] = Math.min(Math.max(drawable._uniforms[variable], this.maxRanges[variable][0]), this.maxRanges[variable][1]);

            vm.renderer.dirty = true;
        }
    }

    changeNumberVar({ variable, value }, { target }) {
        const defaultEffect = this.defaultEffects[variable];
        if (defaultEffect) target.setEffect(defaultEffect, target.effects[defaultEffect] + Scratch.Cast.toNumber(value));
        else if (typeof this.defaultValues[variable] == "boolean") return;
        else {
            const drawable = renderer._allDrawables[target.drawableID];
            drawable._uniforms[variable] += Scratch.Cast.toNumber(value);

            //Clamp to limits
            if (runtime.runtimeOptions.miscLimits) drawable._uniforms[variable] = Math.min(Math.max(drawable._uniforms[variable], this.maxRanges[variable][0]), this.maxRanges[variable][1]);
            vm.renderer.dirty = true;
        }
    }

    setOption({ variable, value }, { target }) {
        if (this.defaultEffects[variable]) return;
        if (typeof this.defaultValues[variable] != "boolean") return;

        renderer._allDrawables[target.drawableID]._uniforms[variable] = Scratch.Cast.toBoolean(value);
        vm.renderer.dirty = true;
    }
  }

  Scratch.extensions.register(new extension());
})(Scratch);
