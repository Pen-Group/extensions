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

uniform float u_waveAmpX;
uniform float u_waveAmpY;

uniform bool u_repeat;

uniform float u_flipX;
uniform float u_flipY;
uniform float u_flipZ;

attribute vec2 a_texCoord;
attribute vec2 a_position;

varying vec2 v_texCoord;

void main() {
	gl_Position = vec4(a_position, 0, 0);
	v_texCoord = a_texCoord;

    if ((u_waveAmpX != 0.0 || u_waveAmpY != 0.0) && !u_repeat) {
        //Calculate
        float highest = u_waveAmpX;
        if (u_waveAmpY > highest) { highest = u_waveAmpY; }
        highest = abs(highest * 2.0) + 1.0;

        gl_Position.xyz *= highest;
        v_texCoord = ((v_texCoord - 0.5) * highest) + 0.5;
    }

    if (u_skewX != 0.0 || u_skewY != 0.0) {
        gl_Position = mat4(
            1, u_skewY / 100.0, 0, 0,
            u_skewX / 100.0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ) * gl_Position;
    }
    

    if (u_flipX != 0.0 || u_flipY != 0.0) {
        //The result of 100 / 3.1415962
        mat4 mulMat = mat4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );

        if (u_flipX != 0.0) {
            float radians = u_flipX / 31.8309526858;
            mulMat = mat4(
                cos(radians), 0, 0, sin(radians),
                0, 1, 0, 0,
                0, 0, 1, 0,
                sin(radians), 0, 0, cos(radians)
            ) * mulMat;
        }

        if (u_flipY != 0.0) {
            float radians = u_flipY / 31.8309526858;
            mulMat = mat4(
                1, 0, 0, 0,
                0, cos(radians), 0, sin(radians),
                0, 0, 1, 0,
                0, sin(radians), 0, cos(radians)
            ) * mulMat;
        }

        gl_Position = gl_Position * mulMat;
    }

    //Move it up
    gl_Position.w = (gl_Position.w * u_flipZ * 0.01) + 1.0;
    gl_Position = u_projectionMatrix * u_modelMatrix * gl_Position;
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
uniform float u_posterize;
uniform float u_contrast;
uniform float u_sepia;
uniform float u_chromatic;

uniform float u_red_e;
uniform float u_green_e;
uniform float u_blue_e;

uniform float u_unfocus;
uniform lowp int u_blur;

uniform bool u_oldColor;
uniform bool u_repeat;
uniform bool u_stretchyWaves;

uniform float u_jumbleX;
uniform float u_jumbleY;
uniform float u_jumbleSeed;

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

highp vec4 daveRandomRange(float lowR, float highR, vec2 coordinates)
{
    lowp float r = (coordinates.x * 50.25313532) + (coordinates.y * 21.5453) + u_jumbleSeed;
    highp float randomizer = r*r/u_jumbleSeed/5398932.234523;
    return mod(vec4(
    fract(sin(mod(randomizer*(91.3458), 1440.0)) * 47453.5453),
    fract(sin(mod(randomizer*(80.3458), 1440.0)) * 48456.5453),
    fract(sin(mod(randomizer*(95.3458), 1440.0)) * 42457.5453),
    fract(sin(mod(randomizer*(85.3458), 1440.0)) * 47553.5453)
    ) - lowR, highR - lowR);
}

const vec2 kCenter = vec2(0.5, 0.5);

void main()
{
	vec2 texcoord0 = v_texCoord;

    if (u_waveAmpX != 0.0) {
        if (u_stretchyWaves) { texcoord0.x += sin(u_waveProgress + texcoord0.x * u_waveSizeX) * u_waveAmpX; }
        else { texcoord0.y += sin(u_waveProgress + texcoord0.x * u_waveSizeX) * u_waveAmpX; }
    }

    if (u_waveAmpY != 0.0) {
        if (u_stretchyWaves) { texcoord0.y += sin(u_waveProgress + texcoord0.y * u_waveSizeY) * u_waveAmpY; }
        else { texcoord0.x += sin(u_waveProgress + texcoord0.y * u_waveSizeY) * u_waveAmpY; }
    }

    if (u_jumbleX != 0.0 || u_jumbleY != 0.0) {
        vec2 costumePixel = floor(texcoord0 * u_skinSize);
        vec4 jumbleCoords = daveRandomRange(0.0, 1.0, costumePixel);
        vec2 offsets = vec2(u_jumbleX / 100.0, u_jumbleY / 100.0);

        texcoord0.x = mix(texcoord0.x, jumbleCoords.x, offsets.x);
        texcoord0.y = mix(texcoord0.y, jumbleCoords.y, offsets.y);
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

    if (u_chromatic > 0.0) {
        vec4 left = texture2D(u_skin, texcoord0 - vec2(u_chromatic / 800.0, 0));
        vec4 right = texture2D(u_skin, texcoord0 + vec2(u_chromatic / 800.0, 0));
        
        gl_FragColor.xyz = vec3(
            left.x, 
            gl_FragColor.y, 
            right.z
        );

        gl_FragColor.w = (left.w + gl_FragColor.w + right.w) * 0.33333;
    }

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

    if (u_posterize != 100.0) {
        vec3 hsv = convertRGB2HSV(gl_FragColor.xyz);
        float blend = 1.0 / u_posterize;

        hsv.y = ceil(hsv.y * u_posterize) * blend;
        hsv.z = ceil(hsv.z * u_posterize) * blend;
        gl_FragColor.xyz = convertHSV2RGB(hsv);
    }

    if (u_contrast != 100.0) {
        gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) * (u_contrast / 100.0) + 0.5;
    }

    //Sepia
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

  let instance;
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
        u_posterize: 100,
        u_contrast: 100,
        u_chromatic: 0,
        u_sepia: 0,
        u_red_e: 100,
        u_green_e: 100,
        u_blue_e: 100,

        u_waveAmpX: 0,
        u_waveAmpY: 0,
        u_waveSizeX: 3.1415962,
        u_waveSizeY: 3.1415962,
        u_waveProgress: 0,

        u_jumbleX: 0,
        u_jumbleY: 0,
        u_jumbleSeed: 1,

        u_blur: 0,
        u_unfocus: 0,
        
        u_skewX: 0,
        u_skewY: 0,
        
        u_flipX: 0,
        u_flipY: 0,
        u_flipZ: 25,

        u_oldColor: true,
        u_repeat: false,
        u_stretchyWaves: false,
    }

    maxRanges = {
        u_saturation: [-100, 100],
        u_posterize: [1, 100],
        u_contrast: [0, 200],
        u_chromatic: [0, 100],
        u_sepia: [0, 100],
        u_red_e: [0, 100],
        u_green_e: [0, 100],
        u_blue_e: [0, 100],
        
        u_waveAmpX: [-1, 1],
        u_waveAmpY: [-1, 1],
        u_waveSizeX: [-6.28318, 6.28318],
        u_waveSizeY: [-6.28318, 6.28318],
        u_waveProgress: [-Infinity, Infinity],

        u_jumbleX: [-100, 100],
        u_jumbleY: [-100, 100],
        u_jumbleSeed: [1, Infinity],
        
        u_blur: [0, 128],
        u_unfocus: [0, 100],
        
        u_skewX: [-100, 100],
        u_skewY: [-100, 100],
        u_flipX: [-Infinity, Infinity],
        u_flipY: [-Infinity, Infinity],
        u_flipZ: [0, 100]
    }

    resetAll() {
        //Load default values
        for (let targetID in runtime.targets) {
            const target = runtime.targets[targetID];

            instance.clearEffects({}, { target });
        }
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
            const drawable = renderer._allDrawables[target.drawableID];
            if (target.isOriginal) {
                if (drawable) drawable._uniforms = {
                    ...drawable._uniforms,
                    ...this.defaultValues
                };
            }
            else {
                if (drawable) drawable._uniforms = {...renderer._allDrawables[target.sprite.clones[0].drawableID]._uniforms};
            }
        });

        runtime.on("PROJECT_START", this.resetAll);
        runtime.on("PROJECT_LOADED", this.resetAll);
    }

    getInfo() {
      this.resetAll();
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
            },
            "---",
            {
                blockType: Scratch.BlockType.COMMAND,
                text: "clear graphic effects",
                arguments: {},
                opcode: "clearEffects",
                extensions: ["colours_looks"],
            },
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
                        text: "posterization",
                        value: "u_posterize"
                    },
                    {
                        text: "contrast",
                        value: "u_contrast"
                    },
                    {
                        text: "chromatic abberation",
                        value: "u_chromatic"
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
                        text: "jumble x",
                        value: "u_jumbleX"
                    },
                    {
                        text: "jumble y",
                        value: "u_jumbleY"
                    },
                    {
                        text: "jumble seed",
                        value: "u_jumbleSeed"
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
                    },
                    {
                        text: "flip x",
                        value: "u_flipX"
                    },
                    {
                        text: "flip y",
                        value: "u_flipY"
                    },
                    {
                        text: "flip depth",
                        value: "u_flipZ"
                    }
                ],
                acceptReporters: true
            },
            options: {
                items: [
                    { text: "use old color functions", value: "u_oldColor" },
                    { text: "repeat costumes", value: "u_repeat" },
                    { text: "stretchy waves", value: "u_stretchyWaves" }
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
        
        blockIconURI: "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIzNy43MzQ0OCIgaGVpZ2h0PSIzOC4xMjIyNCIgdmlld0JveD0iMCwwLDM3LjczNDQ4LDM4LjEyMjI0Ij48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjIxLjEzMjc2LC0xNjAuNzc0NDEpIj48ZyBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiPjxwYXRoIGQ9Ik0yMzcuODgwNDQsMTk3LjgxNjI1Yy04LjkyMzQ5LC0xLjk5MDM4IC0xNC41Nzk2LC0xMC42Nzc2MyAtMTIuNjMzMjgsLTE5LjQwMzU2YzAuMTcxMDksLTAuNzY3MDIgLTQuMTQ1NTcsLTEwLjQxNTE0IC0yLjg4MjUyLC0xMy44NjhjMC45OTYzMSwtMi42MDg2IDkuMzkwNTUsMS43ODY4OCAxMS4zNzM4MywxLjk3NDY3YzQuOTYyNTQsMC4wODA0IDUuOTE3OTksLTEuNDc4NCAxMS4xOTAxOSwtMC4zMDI0NGMxLjU0MDksMC4zNDM2OSA0Ljk4MzM4LC02LjA5NTIgNy4xMjI4LC00LjAzNDk5YzMuOTU2OTYsMy44MTA0NiA2Ljc3Mzc5LDE3Ljc3NDggNS41MTA1LDIzLjQzODUzYy0xLjk0NjMxLDguNzI1OTMgLTEwLjc1ODAyLDE0LjE4NjE1IC0xOS42ODE0OSwxMi4xOTU3N3oiIGZpbGw9IiNmY2IxZTMiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIwIi8+PHBhdGggZD0iTTI0My44MzM4MSwxNjQuMDMwODh6IiBmaWxsPSIjMDAwMDAwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMCIvPjxwYXRoIGQ9Ik0yMzcuODgwNDMsMTk3LjgxNjI0Yy0zLjA2NDA5LC0wLjY4MzQ0IDQuNTI4MzQsLTQuMzgwNDQgNC44MDM5OSwtOS4zMTg0MWMwLjUyNzEyLC05LjQ0Mjc2IC0zLjIyNTAyLC0yMi42NjU4NyAtMS43MDA3OSwtMjIuNzE1MjVjMS4wNjE0MywtMC4wMzQzOSAyLjI5MDcxLDAuMDY1MzQgMy45NDUwMSwwLjQzNDMzYzEuNTQwOSwwLjM0MzY5IDQuOTgzMzgsLTYuMDk1MiA3LjEyMjgsLTQuMDM0OTljMy45NTY5NiwzLjgxMDQ2IDYuNzczNzksMTcuNzc0OCA1LjUxMDUsMjMuNDM4NTNjLTEuOTQ2MzIsOC43MjU5MyAtMTAuNzU4MDIsMTQuMTg2MTUgLTE5LjY4MTQ5LDEyLjE5NTc3eiIgZmlsbD0iI2ZjM2ZiZCIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjAiLz48cGF0aCBkPSJNMjM3Ljg4MDQzLDE5Ny44MTYyNGMtOC45MjM0OSwtMS45OTAzOCAtMTQuNTc5NTksLTEwLjY3NzYzIC0xMi42MzMyOCwtMTkuNDAzNTZjMC4xNzEwOSwtMC43NjcwMiAtNC4xNDU1NywtMTAuNDE1MTQgLTIuODgyNTIsLTEzLjg2OGMwLjk5NjMxLC0yLjYwODYgOS4zOTA1NSwxLjc4Njg4IDExLjM3MzgzLDEuOTc0NjdjNC45NjI1NCwwLjA4MDQgNS45MTc5OSwtMS40Nzg0IDExLjE5MDE5LC0wLjMwMjQ0YzEuNTQwODksMC4zNDM2OSA0Ljk4MzM4LC02LjA5NTIgNy4xMjI4LC00LjAzNDk5YzMuOTU2OTYsMy44MTA0NiA2Ljc3Mzc4LDE3Ljc3NDggNS41MTA0OSwyMy40Mzg1M2MtMS45NDYzMiw4LjcyNTkzIC0xMC43NTgwMiwxNC4xODYxNSAtMTkuNjgxNDksMTIuMTk1Nzd6IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L2c+PC9zdmc+PCEtLXJvdGF0aW9uQ2VudGVyOjE4Ljg2NzI0MjExNzgyMDQ5NjoxOS4yMjU1OTE2NTY0Njg3MS0tPg==",

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

    clearEffects(args, { target }) {
        target.clearEffects();
        renderer._allDrawables[target.drawableID]._uniforms = {
            ...renderer._allDrawables[target.drawableID]._uniforms,
            ...this.defaultValues
        }
    }
  }

  instance = new extension();

  Scratch.extensions.register(instance);
})(Scratch);
