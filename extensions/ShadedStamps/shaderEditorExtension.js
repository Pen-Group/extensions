{  
    let blocksFromUS = 0;
    penPlus.addEventListener("onCompileStart", () => {
        blocksFromUS = 0;
    })
    penPlus.addEventListener("onMainScriptCompiled", () => {
        if (blocksFromUS == 0) return;

        penPlus.Generated_GLSL = `//Our funny \`lil thingy that injects scratch code
uniform highp float u_fisheye;
uniform highp float u_whirl;
uniform highp float u_pixelate;
uniform highp vec2 u_skinSize;
uniform highp float u_mosaic;
uniform highp float u_ghost;
uniform highp float u_brightness;
uniform highp float u_color;

const highp vec2 scratch3_kCenter = vec2(0.5, 0.5);
const highp float scratch3_epsilon = 1e-3;

highp vec2 scratch3_uv_replacement = vec2(0,0);

highp vec3 scratch3_convertRGB2HSV(highp vec3 rgb)
{
	// Hue calculation has 3 cases, depending on which RGB component is largest, and one of those cases involves a "mod"
	// operation. In order to avoid that "mod" we split the M==R case in two: one for G<B and one for B>G. The B>G case
	// will be calculated in the negative and fed through abs() in the hue calculation at the end.
	// See also: https://en.wikipedia.org/wiki/HSL_and_HSV#Hue_and_chroma
	const highp vec4 hueOffsets = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);

	// temp1.xy = sort B & G (largest first)
	// temp1.z = the hue offset we'll use if it turns out that R is the largest component (M==R)
	// temp1.w = the hue offset we'll use if it turns out that R is not the largest component (M==G or M==B)
	highp vec4 temp1 = rgb.b > rgb.g ? vec4(rgb.bg, hueOffsets.wz) : vec4(rgb.gb, hueOffsets.xy);

	// temp2.x = the largest component of RGB ("M" / "Max")
	// temp2.yw = the smaller components of RGB, ordered for the hue calculation (not necessarily sorted by magnitude!)
	// temp2.z = the hue offset we'll use in the hue calculation
	highp vec4 temp2 = rgb.r > temp1.x ? vec4(rgb.r, temp1.yzx) : vec4(temp1.xyw, rgb.r);

	// m = the smallest component of RGB ("min")
	highp float m = min(temp2.y, temp2.w);

	// Chroma = M - m
	highp float C = temp2.x - m;

	// Value = M
	highp float V = temp2.x;

	return vec3(
		abs(temp2.z + (temp2.w - temp2.y) / (6.0 * C + scratch3_epsilon)), // Hue
		C / (temp2.x + scratch3_epsilon), // Saturation
		V); // Value
}

highp vec3 scratch3_convertHue2RGB(highp float hue)
{
	highp float r = abs(hue * 6.0 - 3.0) - 1.0;
	highp float g = 2.0 - abs(hue * 6.0 - 2.0);
	highp float b = 2.0 - abs(hue * 6.0 - 4.0);
	return clamp(vec3(r, g, b), 0.0, 1.0);
}

highp vec3 scratch3_convertHSV2RGB(highp vec3 hsv)
{
	highp vec3 rgb = scratch3_convertHue2RGB(hsv.x);
	highp float c = hsv.z * hsv.y;
	return rgb * c + hsv.z - c;
}

highp vec2 scratch3_apply_UV_Effects(highp vec2 scratch3_input_uv) {
    //Scratch 3 Mosaic
    if (u_mosaic > 0.0) {
	    scratch3_input_uv = fract(u_mosaic * scratch3_input_uv);
    }
    //Scratch 3 Pixelate
    if (u_pixelate > 0.0) {
		// TODO: clean up "pixel" edges
		highp vec2 pixelTexelSize = u_skinSize / u_pixelate;
		scratch3_input_uv = (floor(scratch3_input_uv * pixelTexelSize) + scratch3_kCenter) / pixelTexelSize;
	}

    //Scratch 3 Whirl
    if (u_whirl > 0.0) {
		const highp float kRadius = 0.5;
		highp vec2 offset = scratch3_input_uv - scratch3_kCenter;
		highp float offsetMagnitude = length(offset);
		highp float whirlFactor = max(1.0 - (offsetMagnitude / kRadius), 0.0);
		highp float whirlActual = u_whirl * whirlFactor * whirlFactor;
		highp float sinWhirl = sin(whirlActual);
		highp float cosWhirl = cos(whirlActual);
		highp mat2 rotationMatrix = mat2(
			cosWhirl, -sinWhirl,
			sinWhirl, cosWhirl
		);

		scratch3_input_uv = rotationMatrix * offset + scratch3_kCenter;
	}

    //Scratch 3 Fisheye
    if (u_fisheye > 0.0) {
		highp vec2 vec = (scratch3_input_uv - scratch3_kCenter) / scratch3_kCenter;
		highp float vecLength = length(vec);
		highp float r = pow(min(vecLength, 1.0), u_fisheye) * max(1.0, vecLength);
		highp vec2 unit = vec / vecLength;

		scratch3_input_uv = scratch3_kCenter + r * unit * scratch3_kCenter;
	}

    return scratch3_input_uv;
}

highp vec4 scratch3_apply_color_Effects(highp vec4 scratch3_input_color) {
	scratch3_input_color.rgb = clamp(scratch3_input_color.rgb / (scratch3_input_color.a + scratch3_epsilon), 0.0, 1.0);

    //Scratch 3 Color
    {
		highp vec3 hsv = scratch3_convertRGB2HSV(scratch3_input_color.xyz);

		// this code forces grayscale values to be slightly saturated
		// so that some slight change of hue will be visible
		const highp float minLightness = 0.11 / 2.0;
		const highp float minSaturation = 0.09;
		if (hsv.z < minLightness) hsv = vec3(0.0, 1.0, minLightness);
		else if (hsv.y < minSaturation) hsv = vec3(0.0, minSaturation, hsv.z);

		hsv.x = mod(hsv.x + u_color, 1.0);
		if (hsv.x < 0.0) hsv.x += 1.0;

		scratch3_input_color.rgb = scratch3_convertHSV2RGB(hsv);
	}

    //Scratch 3 brightness
	scratch3_input_color.rgb = clamp(scratch3_input_color.rgb + vec3(u_brightness), vec3(0), vec3(1));

	scratch3_input_color.rgb *= scratch3_input_color.a + scratch3_epsilon;

    //Scratch 3 Ghost
	scratch3_input_color *= u_ghost;

    return scratch3_input_color;
}

//our shader
` + penPlus.Generated_GLSL;
        penPlus.Generated_GLSL = penPlus.Generated_GLSL.replaceAll("v_texCoord","scratch3_uv_replacement")
        .replace("varying highp vec2 scratch3_uv_replacement;","varying highp vec2 v_texCoord;")
        .replace("void vertex() {","void vertex() {\nscratch3_uv_replacement = v_texCoord;\n")
        .replace("void fragment() {","void fragment() {\nscratch3_uv_replacement = v_texCoord;\n");
    });

    class shaded extends penPlus.penPlusExtension {
      getInfo() {
        penPlus.addBlockColorSet("texture_blocks", "#b464e7", "#a755cf", "#9a48c4");
        penPlus.addBlockColorSet("cubemap_blocks", "#8672ff", "#7465d6", "#6657cb");
        return {
          name: "Shaded",
          id: "shaded",
          color1: "#9966ff",
          color2: "#855cd6",
          color3: "#774dcb",
          blocks: [
            {
              opcode: "applyScratchColorEffects",
              type: "command",
              text: "Apply Scratch Color Effects",
              tooltip: "Applies the default Scratch color effects to the current pixel.",
            },
            {
              opcode: "applyScratchUVEffects",
              type: "command",
              text: "Apply Scratch UV Effects",
              tooltip: "Applies the default Scratch UV effects to the current pixel.",
            }
          ],
        };
      }
  
      applyScratchColorEffects(block, generator) {
        blocksFromUS += 1;
        return `gl_FragColor = scratch3_apply_color_Effects(gl_FragColor);` + nextBlockToCode(block, generator);
      }
  
      applyScratchUVEffects(block, generator) {
        blocksFromUS += 1;
        return `scratch3_uv_replacement = scratch3_apply_UV_Effects(scratch3_uv_replacement);` + nextBlockToCode(block, generator);
      }
    }
  
    new shaded();
}