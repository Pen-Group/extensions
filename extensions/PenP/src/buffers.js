extension.drawBufferAttachments = [
    {
        internalFormat: (isWebGL2) ? gl.RGBA32F : gl.RGBA,
        format: gl.RGBA,
        type: (isWebGL2) ? gl.FLOAT : gl.UNSIGNED_BYTE,
        wrap: gl.CLAMP_TO_EDGE,
        premultiplyAlpha: true,

        //Texture
        min: gl.LINEAR
    },
    { format: gl.DEPTH_STENCIL },
];

extension.drawBuffer = twgl.createFramebufferInfo(gl, extension.drawBufferAttachments);

let nativeSize = [];
extension.updateBufferSize = () => {
    nativeSize = renderer.useHighQualityRender
        ? [canvas.width, canvas.height]
        : renderer._nativeSize;

    transform_Matrix[0] = 2 / renderer._nativeSize[0];
    transform_Matrix[1] = -2 / renderer._nativeSize[1];
    
    let lastFB = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    twgl.resizeFramebufferInfo(
        gl,
        extension.drawBuffer,
        extension.drawBufferAttachments,
        Scratch.Cast.toNumber(nativeSize[0]),
        Scratch.Cast.toNumber(nativeSize[1])
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, lastFB);
};

extension.updateBufferSize();