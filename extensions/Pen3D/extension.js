// Name: Pen Plus 3D Addon
// ID: penP3D
// Description: 3d Rendering for pen+
// By: ObviousAlexC <https://scratch.mit.edu/users/pinksheep2917/>
// License: MIT

(function (Scratch) {
  "use strict";

  if (!Scratch.vm.extensionManager.isExtensionLoaded("penP")) {
    //&& Scratch.extensions.isPenguinMod) {
    //Scratch.vm.extensionManager.loadExtensionURL("https://pen-group.github.io/extensions/extensions/PenP/v7.js");
    Scratch.vm.extensionManager.loadExtensionURL(
      "http://localhost:8000/extensions/PenP/v7.js",
    );
  }
  /*else if ((!Scratch.vm.extensionManager.isExtensionLoaded("penP")) && (!Scratch.extensions.isPenguinMod)){
        alert("Addon could not autoload pen+. Load pen+ and try again!");
        throw new Error("Addon could not autoload pen+. Load pen+ and try again!");
    }*/

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
            func: "meshManager",
            blockType: Scratch.BlockType.BUTTON,
            text: "Mesh Manager",
          },
        ],
        name: "Pen+ 3D",
        id: "penP3D",
      };
    }

    meshManager() {
      const { shaderPanel, closeFunc, resizeFunc, nameFunc } =
        runtime.ext_obviousalexc_penPlus._shaderManagerModal();
      nameFunc("Mesh Manager");
      resizeFunc(30, 30);

      {
        const buttoncontainer = document.createElement("div");
        buttoncontainer.style.width = "100%";
        shaderPanel.appendChild(buttoncontainer);

        const importButton = document.createElement("div");
        importButton.innerHTML = "Import Mesh";
        importButton.style.cursor = "pointer";
        importButton.style.padding = "0.75rem 1rem";
        importButton.style.borderRadius = "0.25rem";
        importButton.style.boxSizing = "border-box";
        importButton.style.borderStyle = "solid";
        importButton.style.borderWidth = "0px";
        importButton.style.width = "50%";
        importButton.style.position = "absolute";
        importButton.style.left = "50%";
        importButton.style.transform = "translate(-50%,0%)";
        importButton.style.backgroundColor =
          runtime.ext_obviousalexc_penPlus._menuBarBackground;
        buttoncontainer.appendChild(importButton);

        importButton.onclick = () => {
          //Insert mr batty twist here
          closeFunc();
          this._meshImporter();
        };
      }
    }

    _import_handle_obj(shaderPanel, closeFunc) {}

    _meshImporter() {
      const { shaderPanel, closeFunc, resizeFunc, nameFunc } =
        runtime.ext_obviousalexc_penPlus._shaderManagerModal();
      nameFunc("Mesh Importing");
      resizeFunc(30, 30);

      let file = undefined;

      const updateOptions = () => {
        console.log(file);
        let split = file.name.split(".");
        //Import Handler
        if (this[`_import_handle_${split[split.length - 1].toLowerCase()}`])
          this[`_import_handle_${split[split.length - 1].toLowerCase()}`](
            shaderPanel,
            closeFunc,
          );
      };

      {
        const buttoncontainer = document.createElement("div");
        buttoncontainer.style.width = "100%";
        shaderPanel.appendChild(buttoncontainer);

        const importButton = document.createElement("input");
        importButton.type = "file";
        importButton.accept = ".obj,.dae,.fbx";

        importButton.innerHTML = "Import Mesh";
        importButton.style.cursor = "pointer";
        importButton.style.display = "block";
        importButton.style.borderRadius = "0.25rem";
        importButton.style.padding = "1rem";
        importButton.style.margin = "1rem 0";
        importButton.style.border = "4px dashed var(--ui-tertiary)";
        importButton.style.width = "50%";
        importButton.style.position = "absolute";
        importButton.style.left = "50%";
        importButton.style.transform = "translate(-50%,0%)";
        importButton.style.background = "none";
        buttoncontainer.appendChild(importButton);

        importButton.onchange = (event) => {
          file = importButton.files[0];
          updateOptions();
        };
      }
    }
  }

  Scratch.extensions.register(new extension());
})(Scratch);
