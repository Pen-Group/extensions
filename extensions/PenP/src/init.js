if (!Scratch.extensions.unsandboxed) {
    //for those who use the version from pen-group's site
    alert("Pen+ must be ran unsandboxed!");
    throw new Error("Pen+ must run unsandboxed");
}

/* EXTENSION SETTINGS */
const TRIANGLES_PER_BUFFER = 10000;

//?some smaller optimizations just store the multiplacation for later
const d2r = 0.0174533;

//?Declare most of the main repo's we are going to use around the scratch vm
const vm = Scratch.vm;
const runtime = vm.runtime;
const renderer = runtime.renderer;
const twgl = renderer.exports.twgl;

const canvas = renderer.canvas;
const gl = renderer._gl;

const isWebGL2 = gl.getParameter(gl.VERSION).includes("2.0");

//Native size. The size of the pen-layer.
let nativeSize = renderer.useHighQualityRender
    ? [canvas.width, canvas.height]
    : renderer._nativeSize;

//If we have webGL2 add the float color buffer extension!
if (isWebGL2) {
    const ext = gl.getExtension("EXT_color_buffer_float");
}