// Name: Pen Plus 3D Addon
// ID: penP3D
// Description: 3d Rendering for pen+
// By: ObviousAlexC <https://scratch.mit.edu/users/pinksheep2917/>
// License: MIT

(function (Scratch) {
  "use strict";

  
  //Pen+ Addon API
  let penPlus; Scratch.vm.runtime.on("EXTENSION_ADDED", () => {penPlus = runtime.ext_obviousalexc_penPlus}); if (!Scratch.vm.extensionManager.isExtensionLoaded("penP")) {if (Scratch.extensions.isPenguinMod) {Scratch.vm.extensionManager.loadExtensionURL("https://pen-group.github.io/extensions/extensions/PenP/v7.js");} else {Scratch.vm.extensionManager.loadExtensionURL("https://extensions.turbowarp.org/obviousAlexC/penPlus.js");}}
  
  if (!Scratch.extensions.unsandboxed) {
    //for those who use the version from pen-group's site
    alert("Pen+ 3d must be ran unsandboxed!");
    throw new Error("Pen+ 3d must run unsandboxed");
  }

  const vm = Scratch.vm;
  const runtime = vm.runtime;

  const fileReader = new FileReader();

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

    twStyledInput(input) {
      input.style.cursor = "pointer";
      input.style.display = "block";
      input.style.borderRadius = "0.25rem";
      input.style.padding = "1rem";
      input.style.margin = "1rem 0";
      input.style.border = "4px dashed var(--ui-tertiary)";
      input.style.width = "50%";
      input.style.marginLeft = "50%";
      input.style.transform = "translate(-50%,0%)";
      input.style.background = "none";
    }

    _import_handle_obj(file, shaderPanel, closeFunc) {
      const parsedModel = {};
      let objectName = "";

      fileReader.onload = () => {
        fileReader.result.split("\n").forEach(line => {
          const splitLine = line.split(" ");
          
          console.log(line);
          switch (splitLine[0]) {
            case "o":
              splitLine.shift();
              objectName = splitLine.join(" ");
              parsedModel[objectName] = {
                materials: {}
              };
              break;

            case "usemtl":
              splitLine.shift();
              parsedModel[objectName].materials[splitLine.join(" ")] = {};
              break;
          
            default:
              break;
          }
        })
        console.log(parsedModel);
      }
      fileReader.readAsText(file);

      const mtlButton = document.createElement("input")
      mtlButton.type = "file";
      mtlButton.accept = ".mtl";

      mtlButton.innerHTML = "Import Mesh";
      this.twStyledInput(mtlButton);

      shaderPanel.appendChild(mtlButton);

      let mtlFile = null;

      mtlButton.onchange = (event) => {
        mtlFile = mtlButton.files[0];
        mtlButton.disabled = true;

        fileReader.onload = () => {
          fileReader.result.split("\n").forEach(line => {
            const splitLine = line.split(" ");
            
            switch (splitLine[0]) {
              case "newmtl":
                
                break;
            
              default:
                break;
            }
          })
        }
        fileReader.readAsText(mtlFile);
      };

    }

    _import_handle_fbx(file, shaderPanel, closeFunc) {}

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
            file,
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
        importButton.accept = ".obj,.dae,.fbx,.bbmodel,.gltf";

        importButton.innerHTML = "Import Mesh";
        this.twStyledInput(importButton);
        shaderPanel.appendChild(importButton);

        importButton.onchange = (event) => {
          file = importButton.files[0];
          importButton.disabled = true;
          updateOptions();
        };
      }
    }
  }

  Scratch.extensions.register(new extension());
})(Scratch);
