// Name: Pen Plus 3D Addon
// ID: penP3D
// Description: 3d Rendering for pen+
// By: ObviousAlexC <https://scratch.mit.edu/users/pinksheep2917/>
// License: MIT

(function (Scratch) {
    "use strict";
  
    if ((!Scratch.vm.extensionManager.isExtensionLoaded("penP")) && Scratch.extensions.isPenguinMod) {
      Scratch.vm.extensionManager.loadExtensionURL("https://pen-group.github.io/extensions/extensions/PenP/v7.js");
    }
    else if ((!Scratch.vm.extensionManager.isExtensionLoaded("penP")) && (!Scratch.extensions.isPenguinMod)){
      alert("Addon could not autoload pen+. Load pen+ and try again!");
      throw new Error("Addon could not autoload pen+. Load pen+ and try again!");
    }
  
    if (!Scratch.extensions.unsandboxed) {
        //for those who use the version from pen-group's site
        alert("Pen+ 3d must be ran unsandboxed!");
        throw new Error("Pen+ 3d must run unsandboxed");
    }
  
    const vm = Scratch.vm;
    const runtime = vm.runtime;
  
    class extension {
        getInfo() {
            return {
                blocks: [
                    {
                        opcode: "meshManager",
                        blockType: Scratch.BlockType.BUTTON,
                        text: "Mesh Manager",
                    }
                ],
                name: "Pen+ 3D",
                id: "penP3D",
            }
        }
  
        meshManager() {
          const { shaderPanel, closeFunc, resizeFunc, nameFunc } = runtime.ext_obviousalexc_penPlus._shaderManagerModal();
          nameFunc("Mesh Manager")
          resizeFunc(40,40);
        }
    }
  
    Scratch.extensions.register(new extension());
  })(Scratch);