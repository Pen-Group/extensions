// Name: [NAME]
// ID: [ID]
// Description: [DESCRIPTION]
// By: [AUTHOR] <[URL]>
// License: [LICENSE]
[HEADER]
(function (Scratch) {
    "use strict";
  
    //This is setup for EBT
    let instance;
    let buildDate = "BUILD_DATE";
    
    //Make the extension class before anything
    class extensionClass {
        constructor() {
            //Make sure we initilize our extension
            if (this.init) this.init();
        }

        getInfo() {
            return {
                //These are here for failsafes
                name: this._name || "extension",
                id: this._id || "extension",
                blocks: this._blocks || [],
                menus: this._menus || {},

                //These can be undefined
                color1: this._color1 || undefined,
                color2: this._color2 || undefined,
                color3: this._color3 || undefined,
                menuIconURI: this._menuIconURI || undefined,
                blockIconURI: this._blockIconURI || undefined,
                docsURI: this._docsURI || undefined,
            }
        }
    }
    
    const extension = extensionClass.prototype;

    //Get this out of the way.
    extension.blocks = [];
    extension.menus = {};

    //Do this in a for as to not hit the limit
    const defineBlocks = (blockArray) => {
        for (let blockID in blockArray) {
            extension.blocks.push(blockArray[blockID]);
        }
    }

    const defineMenus = (menuObject) => {
        for (let menuKey in menuObject) {
            extension.menus[menuKey] = menuObject[menuKey];
        }
    }

//END
})(Scratch);