(function (Scratch) {
  "use strict";

  const vm = Scratch.vm;
  const runtime = vm.runtime;
  const renderer = runtime.renderer;
  const gl = renderer._gl;
  const twgl = renderer.exports.twgl;

  class ListStorage {
    storage = {};

    getInfo() {
      return {
        name: "Mesh Storage",
        id: "OACListStorage",
        color1: "#ff661a",
        color2: "#f2590d",
        color3: "#e64d00",
        blocks: [
          {
            blockType: Scratch.BlockType.LABEL,
            text: "Have pen+ for this to work",
          },
          {
            opcode: "createData",
            blockType: Scratch.BlockType.COMMAND,
            text: "create list data named [name] using [list]",
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Mesh",
              },
              list: {
                type: Scratch.ArgumentType.STRING,
                menu: "listMenu",
              },
            },
            extensions: ["colours_data_lists"],
          },
          {
            opcode: "doesDataExist",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "does list data named [name] exist?",
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Mesh",
              },
            },
            extensions: ["colours_data_lists"],
          }, //renderShaderTrisFromList
          {
            opcode: "deleteListData",
            blockType: Scratch.BlockType.COMMAND,
            text: "remove list data named [name]",
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Mesh",
              },
            },
            extensions: ["colours_data_lists"],
          },
          {
            opcode: "renderShaderTrisFromList",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate(
              "draw shader triangles from data [name] using [shader]"
            ),
            arguments: {
                name: { 
                    type: Scratch.ArgumentType.STRING,
                    defaultValue: "Mesh", 
                },
              shader: {
                type: Scratch.ArgumentType.STRING,
                menu: "penPlusShaders",
              },
            },
            filter: "sprite",
          },
          {
            opcode: "removeAllListData",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate(
              "remove all storage data"
            ),
            extensions: ["colours_data_lists"],
          }
        ],
        menus: {
          listMenu: {
            acceptReporters: true,
            items: "_getLists",
          },
          penPlusShaders: {
            items:"shaderMenu"
          }
        },
      };
    }

    //From lily's list tools... With permission of course.
    _getLists() {
      const lists =
        typeof Blockly === "undefined"
          ? []
          : Blockly.getMainWorkspace()
              .getVariableMap()
              .getVariablesOfType("list")
              .map((model) => model.name);
      if (lists.length > 0) {
        return lists;
      } else {
        return [""];
      }
    }

    //And the associated helper function
    _getVarObjectFromName(name, util, type) {
      const stageTarget = runtime.getTargetForStage();
      const target = util.target;
      let listObject = Object.create(null);

      listObject = stageTarget.lookupVariableByNameAndType(name, type);
      if (listObject) return listObject;
      listObject = target.lookupVariableByNameAndType(name, type);
      if (listObject) return listObject;
    }

    _getTriDataFromList(list, util) {
      //Might be bad code? I dunno
      const listREF = this._getVarObjectFromName(list, util, "list");
      if (!listREF) return { successful: false };

      const listOBJ = listREF.value;
      if (!listOBJ) return { successful: false };
      let merged = {};

      //Map the list object if we can't find something
      listOBJ.map(function (str) {
        const obj = JSON.parse(str);
        //Check through each object
        Object.keys(obj).forEach((key) => {
          //Merge the keys if possible
          //!!No built in function for this to my knowledge!!
          if (!merged[key]) {
            merged[key] = obj[key];
          } else {
            merged[key].push(...obj[key]);
          }
        });
      });

      //Parse these into F32 arrays for performance.
      const keys = Object.keys(merged);
      keys.forEach((key) => {
        merged[key] = new Float32Array(merged[key]);
      });

      return {
        triData: merged,
        listLength: listOBJ.length,
        keys: keys,
        successful: true,
      };
    }

    createData({ name, list }, util) {
      const parsed = this._getTriDataFromList(list, util);

      if (!parsed.successful) return;

      this.storage[name] = parsed;
    }

    doesDataExist({ name }) {
      return typeof this.storage[name] != "undefined";
    }

    deleteListData({ name }) {
      if (!this.storage[name]) return;

      delete this.storage[name];
    }

    removeAllListData() {
      Object.keys(this.storage).forEach(key => {
        delete this.storage[key];
      })
    }

    renderShaderTrisFromList({ name, shader }, util) {
      if (!this.storage[name]) return;

      // prettier-ignore
      if (!Scratch.vm.runtime.ext_obviousalexc_penPlus.inDrawRegion) renderer.enterDrawRegion(Scratch.vm.runtime.ext_obviousalexc_penPlus.penPlusDrawRegion);

      const { triData, listLength, keys } = this.storage[name];

      const buffer = Scratch.vm.runtime.ext_obviousalexc_penPlus.programs[shader].buffer;

      if (!Scratch.vm.runtime.ext_obviousalexc_penPlus.programs[shader]) return;

      //Make sure we have the triangle data updating accordingly
      Scratch.vm.runtime.ext_obviousalexc_penPlus.trianglesDrawn += listLength;
      buffer.numElements = listLength * 3;

      // prettier-ignore
      keys.forEach(key => {
          //Check to see if the key exists here
          if (!buffer.attribs[key]) return;
          //Then use the key in the shader
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer.attribs[key].buffer);
          gl.bufferData(gl.ARRAY_BUFFER, triData[key], gl.DYNAMIC_DRAW);
        });

      //? Bind Positional Data
      twgl.setBuffersAndAttributes(gl, Scratch.vm.runtime.ext_obviousalexc_penPlus.programs[shader].info, buffer);

      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      //Just use the real scratch timer.
      Scratch.vm.runtime.ext_obviousalexc_penPlus.programs[shader].uniformDat.u_timer =
        runtime.ext_scratch3_sensing.getTimer({}, util);
      Scratch.vm.runtime.ext_obviousalexc_penPlus.programs[shader].uniformDat.u_res = [
        Scratch.vm.runtime.ext_obviousalexc_penPlus.currentRenderTexture.width,
        Scratch.vm.runtime.ext_obviousalexc_penPlus.currentRenderTexture.height,
      ];

      gl.useProgram(Scratch.vm.runtime.ext_obviousalexc_penPlus.programs[shader].info.program);

      twgl.setUniforms(
        Scratch.vm.runtime.ext_obviousalexc_penPlus.programs[shader].info,
        Scratch.vm.runtime.ext_obviousalexc_penPlus.programs[shader].uniformDat
      );

      twgl.drawBufferInfo(gl, buffer);

      buffer.numElements = 3;
    }

    shaderMenu() {
        if (Scratch.vm.runtime.ext_obviousalexc_penPlus) {
          return Scratch.vm.runtime.ext_obviousalexc_penPlus.shaderMenu();
        }
        return ["None Yet"];
      }
  }

  Scratch.extensions.register(new ListStorage());
})(Scratch);
