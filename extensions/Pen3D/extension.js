// Name: Pen Plus 3D Addon
// ID: penP3D
// Description: 3d Rendering for pen+
// By: ObviousAlexC <https://scratch.mit.edu/users/pinksheep2917/>
// License: MIT

(function (Scratch) {
    "use strict";

    if ((!Scratch.vm.extensionManager.isExtensionLoaded("penP")) && Scratch.extensions.isPenguinMod) {
        window.vm.extensionManager.loadExtensionURL("https://pen-group.github.io/extensions/extensions/PenP/v7.js");
    }

    if (!Scratch.extensions.unsandboxed) {
        //for those who use the version from pen-group's site
        alert("Pen+ 3d must be ran unsandboxed!");
        throw new Error("Pen+ 3d must run unsandboxed");
    }

    class extension {
        getInfo() {
            return {
                blocks: [
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "You.. Aren't",
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "supposed to be",
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "here",
                    },
                ],
                name: "Pen+ 3D",
                id: "penP3D",
            }
        }
    }

    Scratch.extensions.register(new extension());
})(Scratch);