// Name: Pen Plus 3D Addon
// ID: penP3D
// Description: 3d Rendering for pen+
// By: ObviousAlexC <https://scratch.mit.edu/users/pinksheep2917/>
// License: MIT

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    //for those who use the version from pen-group's site
    alert("Shaded Stamps must be ran unsandboxed!");
    throw new Error("Shaded Stamps must run unsandboxed");
  }

  //Pen+ Addon API
  let penPlus; Scratch.vm.runtime.on("EXTENSION_ADDED", () => {penPlus = runtime.ext_obviousalexc_penPlus}); if (!Scratch.vm.extensionManager.isExtensionLoaded("penP")) {if (Scratch.extensions.isPenguinMod) {Scratch.vm.extensionManager.loadExtensionURL("https://pen-group.github.io/extensions/extensions/PenP/v7.js");} else {Scratch.vm.extensionManager.loadExtensionURL("https://extensions.turbowarp.org/obviousAlexC/penPlus.js");}}


  const vm = Scratch.vm;
  const runtime = vm.runtime;
  const renderer = runtime.renderer;
  const gl = renderer._gl;
  const twgl = renderer.exports.twgl;

  let reRenderInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position:    { numComponents: 4, data: [
      -1, -1, 0, 1,
      1, -1, 0, 1,
      1, 1, 0, 1,
      -1, -1, 0, 1,
      1, 1, 0, 1,
      -1, 1, 0, 1
    ]},
    a_texCoord: { numComponents: 2, data: [
      0,1,
      1,1,
      1,0,
      0,1,
      1,0,
      0,0
    ]},
    a_color: { numComponents: 4, data: [
      1,1,1,1,
      1,1,1,1,
      1,1,1,1,

      1,1,1,1,
      1,1,1,1,
      1,1,1,1
    ]}
  });

  const stageBufferAttachments = [
    {
      format: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
      min: gl.LINEAR,
      wrap: gl.CLAMP_TO_EDGE,
      premultiplyAlpha: true,
    },
    { format: gl.DEPTH_STENCIL },
  ];
  const stageBuffer = twgl.createFramebufferInfo(gl, stageBufferAttachments);

  let currentFrameBuffer = null;
  let currentShader = null;

  class extension {
    //Will allow us to use custom shaders within our entire stage.
    customDrawFunction() {
      if (!renderer.dirty) {
          return;
      }
      renderer.dirty = false;

      renderer._doExitDrawRegion();

      const gl = renderer._gl;
      
      //Our injected code
      if (currentFrameBuffer) {
        twgl.resizeFramebufferInfo(
          gl,
          currentFrameBuffer,
          stageBufferAttachments,
          Scratch.Cast.toNumber(gl.canvas.width),
          Scratch.Cast.toNumber(gl.canvas.height)
        );

        twgl.bindFramebufferInfo(gl, currentFrameBuffer);
      }
      else {
        twgl.bindFramebufferInfo(gl, null);
      }

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(...renderer._backgroundColor4f);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const snapshotRequested = renderer._snapshotCallbacks.length > 0;
      renderer._drawThese(renderer._drawList, 'default', renderer._projection, {
          framebufferWidth: gl.canvas.width,
          framebufferHeight: gl.canvas.height,
          skipPrivateSkins: snapshotRequested
      });
      if (snapshotRequested) {
          const snapshot = gl.canvas.toDataURL();
          renderer._snapshotCallbacks.forEach(cb => cb(snapshot));
          renderer._snapshotCallbacks = [];
          // We need to make sure to always render next frame so that private skins
          // that were skipped this frame will become visible again shortly.
          renderer.dirty = true;
      }

      if (currentFrameBuffer) {
        if (!penPlus.shaders[currentShader]) {
          this.resetBuffer();
          //re-render if no shader is found.
          renderer.dirty = true;
          return;
        }

        twgl.bindFramebufferInfo(gl, null);
        console.log(penPlus.programs[currentShader]);
        gl.useProgram(penPlus.programs[currentShader].info.program);

        twgl.setBuffersAndAttributes(
          gl,
          penPlus.programs[currentShader].info,
          reRenderInfo
        );

        penPlus.programs[currentShader].uniformDat.u_skin = stageBuffer.attachments[0];
        penPlus.programs[currentShader].uniformDat.u_res = [
          gl.canvas.width,
          gl.canvas.height,
        ];
        penPlus.programs[currentShader].uniformDat.u_timer = runtime.ioDevices.clock.projectTimer();
        
        penPlus.programs[currentShader].uniformDat.u_transform = [
          1,1,0,0,
          0,1,0,0,
          0,0,0,0,
          0,0,0,0
        ]

        twgl.setUniforms(penPlus.programs[currentShader].info, penPlus.programs[currentShader].uniformDat);

        twgl.drawBufferInfo(gl, reRenderInfo);
        renderer.dirty = true;
      }
    }

    constructor() {
      renderer.draw = this.customDrawFunction;
    }

    getInfo() {
      return {
        blocks: [
          {
            blockType:Scratch.BlockType.LABEL,
            text:"put a random pen+ block in to save shaders!"
          },
          {
            opcode: "stampShader",
            blockType: Scratch.BlockType.COMMAND,
            text: "stamp using [shader]",
            arguments: {
              shader: {
                type: Scratch.ArgumentType.STRING,
                menu: "shaders",
              },
            },
            filter: "sprite",
          },
          {
            opcode: "setStageShader",
            blockType: Scratch.BlockType.COMMAND,
            text: "use [shader] on the stage",
            arguments: {
              shader: {
                type: Scratch.ArgumentType.STRING,
                menu: "shadersAndStage",
              },
            },
            filter: "sprite",
          },
        ],
        menus: {
          shaders: {
            items:"shaderMenu"
          },
          shadersAndStage: {
            items:"shaderMenuAndStage"
          }
        },
        name: "Shaded",
        id: "OACShaded",
      };
    }

    shaderMenu() {
      if (penPlus) {
        return penPlus.shaderMenu();
      }
      return ["None Yet"];
    }

    shaderMenuAndStage() {
      if (penPlus) {
        let returnedShaders = [{value:"____PEN_PLUS__NO__SHADER____", text:"No Shader!"}];
        const penPShaders = Object.keys(penPlus.shaders);
        penPShaders.forEach(shader => {
          returnedShaders.push({value:shader,text:shader});
        });

        return returnedShaders;
      }
      return [{value:"____PEN_PLUS__NO__SHADER____", text:"No Shader!"}];
    }

    stampShader({ shader },util) {
      const curTarget = util.target;
      if (!penPlus.programs[shader]) return;

      const costIndex = curTarget.getCostumeIndexByName(
        Scratch.Cast.toString(name)
      );

      if (costIndex >= 0) {
        const curCostume = curTarget.sprite.costumes[costIndex];

        if (costIndex != curTarget.currentCostume) {
          curTarget.setCostume(costIndex);
        }

        let currentTexture = renderer._allSkins[curCostume.skinId]._uniforms.u_skin;

        if (currentTexture) {
          gl.bindFramebuffer(gl.FRAMEBUFFER,renderer._allSkins[renderer._penSkinId]._framebuffer.framebuffer);



          renderer.dirty = true;
        }
      }
    }

    resetBuffer() {
      console.log("buffer reset");
      currentFrameBuffer = null;
      renderer.dirty = true;
    }

    setStageShader({ shader },util) {
      if (shader == "____PEN_PLUS__NO__SHADER____") {
        this.resetBuffer();
        console.log(`shader removed`);
        return;
      }
      
      if (currentFrameBuffer != stageBuffer) {
        currentFrameBuffer = stageBuffer;
      }
      currentShader = shader;

      if (!penPlus.shaders[shader]) {
        this.resetBuffer();
        console.log(`shader ${shader} not found`);
        return;
      }

      renderer.dirty = true;
    }
  }

  Scratch.extensions.register(new extension());
})(Scratch);
