const modalAPI = {
    _handlePMvsEM: (variableName) => {
        switch (variableName) {
          case "--menu-bar-background":
            return Scratch.extensions.isElectraMod
              ? "var(--menu-bar-background, hsla(244, 23%, 48%, 1))"
              : "var(--menu-bar-background, #009CCC)";
  
          case "--ui-modal-overlay":
            return Scratch.extensions.isElectraMod
              ? "var(--ui-modal-overlay, hsla(244, 23%, 48%, 0.9))"
              : "var(--ui-modal-overlay, hsla(194, 100%, 65%, 0.9))";
  
          default:
            break;
        }
      },
    
      _setupTheme: () => {
        //Use a predefined pen+ theme if packaged
        if (typeof scaffolding !== "undefined") {
            modalAPI._menuBarBackground = "#0FBD8C";
            modalAPI._defaultBackgroundColor = "white";
            modalAPI._textColor = "black";
            modalAPI._buttonShadow = "hsla(0, 0%, 0%, 0.15)";
            modalAPI.fade = "#0FBD8CDD";
            modalAPI._shadowBorder = "hsla(0, 100%, 100%, 0.25)";
          return;
        }
  
        //Also if this looks bad it's due to prettier
        //I support friendly competition!
        modalAPI._menuBarBackground = Scratch.extensions.isPenguinMod
          ? //This is penguinmod blue
            modalAPI._handlePMvsEM("--menu-bar-background")
          : //Turbowarp
            "var(--menu-bar-background)";
  
        //Of course due to the GUI version differences I need to conduct some checks on these
        modalAPI._defaultBackgroundColor = Scratch.extensions.isPenguinMod
          ? //Wierd old turbowarp vm thingy right here
            document.body.getAttribute("theme") == "dark"
            ? "var(--ui-primary)"
            : "white"
          : //New accent stuff me likey.
            "var(--ui-modal-background)";
  
        //But in general its fine
        modalAPI._textColor = Scratch.extensions.isPenguinMod
          ? document.body.getAttribute("theme") == "dark"
            ? "white"
            : "black"
          : //Again with the accents. Me likey
            "var(--ui-modal-foreground)";
  
            modalAPI._buttonShadow = Scratch.extensions.isPenguinMod
          ? "hsla(0, 0%, 0%, 0.15)"
          : "var(--ui-black-transparent)";
  
        modalAPI.fade = modalAPI._handlePMvsEM("--ui-modal-overlay");
  
        modalAPI._shadowBorder = Scratch.extensions.isPenguinMod
          ? "hsla(0, 100%, 100%, 0.25)"
          : "var(--ui-white-transparent)";
      },

      openModal: (text) => {
        modalAPI._setupTheme();
        const bgFade = document.createElement("div");
        bgFade.style.width = "100%";
        bgFade.style.height = "100%";
  
        bgFade.style.position = "absolute";
        bgFade.style.left = "0px";
        bgFade.style.top = "0px";
  
        bgFade.style.backgroundColor = modalAPI.fade;
  
        bgFade.style.zIndex = "10001";
  
        document.body.appendChild(bgFade);
  
        /*
  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀  ⠀⢀⡔⣻⠁⠀⢀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀
  ⠀⠀⠀⠀⢀⣾⠳⢶⣦⠤⣀⠀⠀⠀⠀⠀⠀⠀⣾⢀⡇⡴⠋⣀⠴⣊⣩⣤⠶⠞⢹⣄⠀⠀⠀
  ⠀⠀⠀⠀⢸⠀⠀⢠⠈⠙⠢⣙⠲⢤⠤⠤⠀⠒⠳⡄⣿⢀⠾⠓⢋⠅⠛⠉⠉⠝⠀⠼⠀⠀⠀
  ⠀⠀⠀⠀⢸⠀⢰⡀⠁⠀⠀⠈⠑⠦⡀⠀⠀⠀⠀⠈⠺⢿⣂⠀⠉⠐⠲⡤⣄⢉⠝⢸⠀⠀⠀
  ⠀⠀⠀⠀⢸⠀⢀⡹⠆⠀⠀⠀⠀⡠⠃⠀⠀⠀⠀⠀⠀⠀⠉⠙⠲⣄⠀⠀⠙⣷⡄⢸⠀⠀⠀
  ⠀⠀⠀⠀⢸⡀⠙⠂⢠⠀⠀⡠⠊⠀⠀⠀⠀⢠⠀⠀⠀⠀⠘⠄⠀⠀⠑⢦⣔⠀⢡⡸⠀⠀⠀
  ⠀⠀⠀⠀⢀⣧⠀⢀⡧⣴⠯⡀⠀⠀⠀⠀⠀⡎⠀⠀⠀⠀⠀⢸⡠⠔⠈⠁⠙⡗⡤⣷⡀⠀⠀
  ⠀⠀⠀⠀⡜⠈⠚⠁⣬⠓⠒⢼⠅⠀⠀⠀⣠⡇⠀⠀⠀⠀⠀⠀⣧⠀⠀⠀⡀⢹⠀⠸⡄⠀⠀
  ⠀⠀⠀⡸⠀⠀⠀⠘⢸⢀⠐⢃⠀⠀⠀⡰⠋⡇⠀⠀⠀⢠⠀⠀⡿⣆⠀⠀⣧⡈⡇⠆⢻⠀⠀
  ⠀⠀⢰⠃⠀⠀⢀⡇⠼⠉⠀⢸⡤⠤⣶⡖⠒⠺⢄⡀⢀⠎⡆⣸⣥⠬⠧⢴⣿⠉⠁⠸⡀⣇⠀
  ⠀⠀⠇⠀⠀⠀⢸⠀⠀⠀⣰⠋⠀⢸⣿⣿⠀⠀⠀⠙⢧⡴⢹⣿⣿⠀⠀⠀⠈⣆⠀⠀⢧⢹⡄
  ⠀⣸⠀⢠⠀⠀⢸⡀⠀⠀⢻⡀⠀⢸⣿⣿⠀⠀⠀⠀⡼⣇⢸⣿⣿⠀⠀⠀⢀⠏⠀⠀⢸⠀⠇
  ⠀⠓⠈⢃⠀⠀⠀⡇⠀⠀⠀⣗⠦⣀⣿⡇⠀⣀⠤⠊⠀⠈⠺⢿⣃⣀⠤⠔⢸⠀⠀⠀⣼⠑⢼
  ⠀⠀⠀⢸⡀⣀⣾⣷⡀⠀⢸⣯⣦⡀⠀⠀⠀⢇⣀⣀⠐⠦⣀⠘⠀⠀⢀⣰⣿⣄⠀⠀⡟⠀⠀
  ⠀⠀⠀⠀⠛⠁⣿⣿⣧⠀⣿⣿⣿⣿⣦⣀⠀⠀⠀⠀⠀⠀⠀⣀⣠⣴⣿⣿⡿⠈⠢⣼⡇⠀⠀           Bryunyeuuuuuu
  ⠀⠀⠀⠀⠀⠀⠈⠁⠈⠻⠈⢻⡿⠉⣿⠿⠛⡇⠒⠒⢲⠺⢿⣿⣿⠉⠻⡿⠁⠀⠀⠈⠁⠀⠀          Smooth criminal
  ⢀⠤⠒⠦⡀⠀⠀⠀⠀⠀⠀⠀⢀⠞⠉⠆⠀⠀⠉⠉⠉⠀⠀⡝⣍⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  ⡎⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⡰⠋⠀⠀⢸⠀⠀⠀⠀⠀⠀⠀⢡⠈⢦⠀⠀⠀⠀⠀⠀⠀⠀⠀
  ⡇⠀⠀⠸⠁⠀⠀⠀⠀⢀⠜⠁⠀⠀⠀⡸⠀⠀⠀⠀⠀⠀⠀⠘⡄⠈⢳⡀⠀⠀⠀⠀⠀⠀⠀
  ⡇⠀⠀⢠⠀⠀⠀⠀⠠⣯⣀⠀⠀⠀⡰⡇⠀⠀⠀⠀⠀⠀⠀⠀⢣⠀⢀⡦⠤⢄⡀⠀⠀⠀⠀
  ⢱⡀⠀⠈⠳⢤⣠⠖⠋⠛⠛⢷⣄⢠⣷⠁⠀⠀⠀⠀⠀⠀⠀⠀⠘⡾⢳⠃⠀⠀⠘⢇⠀⠀⠀
  ⠀⠙⢦⡀⠀⢠⠁⠀⠀⠀⠀⠀⠙⣿⣏⣀⠀⠀⠀⠀⠀⠀⠀⣀⣴⣧⡃⠀⠀⠀⠀⣸⠀⠀⠀
  ⠀⠀⠀⠈⠉⢺⣄⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣗⣤⣀⣠⡾⠃⠀⠀⠀
  ⠀⠀⠀⠀⠀⠀⠣⢅⡤⣀⣀⣠⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠉⠉⠉⠀⠀⠀⠀⠀
  ⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠁⠀⠉⣿⣿⣿⣿⣿⡿⠻⣿⣿⣿⣿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀
  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⠀⠀⠀⠀⣿⣿⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣟⠀⠀⢠⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⠀⠀⢸⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⡏⠀⠀⢸⣿⣿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⠀⠀⠀⢺⣿⣿⣿⣿⣿⣿⣷⠀⠀⠀⠀⠀⠀⠀⠀
  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠈⠉⠻⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀
  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀
        */
        const shaderManager = document.createElement("div");
  
        //Create our menu modal
        shaderManager.style.backgroundColor = modalAPI._menuBarBackground;
        shaderManager.style.width = "50%";
        shaderManager.style.height = "50%";
        shaderManager.style.position = "relative";
        shaderManager.style.top = "50%";
        shaderManager.style.left = "50%";
        shaderManager.style.borderRadius = "8px";
        shaderManager.style.borderColor = modalAPI._shadowBorder;
        shaderManager.style.borderWidth = "4px";
        shaderManager.style.borderStyle = "solid";
        shaderManager.style.aspectRatio = "5/3";
        shaderManager.style.transform = "translate(-50%,25%)";
        shaderManager.style.zIndex = "10002";
  
        //!DONT FORGET THIS IS HERE
        shaderManager.style.textAlign = "center";
  
        shaderManager.style.color = "#ffffff";
  
        document.body.appendChild(shaderManager);
  
        //This is the text that shows up on-top of the modal
        const topText = document.createElement("div");
  
        topText.style.width = "100%";
        topText.style.height = "48px";
        topText.style.top = "0px";
        topText.style.left = "0px";
        topText.style.position = "absolute";
        topText.style.transform = "translate(0%,12px)";
  
        topText.style.fontSize = "24px";
  
        topText.textContent = text || "modal";
  
        shaderManager.appendChild(topText);
  
        //Then we have the inner panel. Where most of the ui goes
        const shaderPanel = document.createElement("div");
  
        shaderPanel.style.backgroundColor = modalAPI._defaultBackgroundColor;
        shaderPanel.style.width = "100%";
        shaderPanel.style.height = "calc(100% - 48px)";
        shaderPanel.style.position = "absolute";
        shaderPanel.style.top = "48px";
        shaderPanel.style.left = "0%";
        shaderPanel.style.borderBottomLeftRadius = "4px";
        shaderPanel.style.borderBottomRightRadius = "4px";
  
        shaderManager.appendChild(shaderPanel);
  
        //The actual container no filter to avoid buggy things
        const closeMenu = document.createElement("div");
  
        closeMenu.style.width = "1.75rem";
        closeMenu.style.height = "1.75rem";
        closeMenu.style.backgroundColor = modalAPI._buttonShadow;
        closeMenu.style.position = "absolute";
        closeMenu.style.left = "calc(100% - 2rem)";
        closeMenu.style.top = "0.25rem";
        closeMenu.style.borderRadius = "50%";
        closeMenu.style.alignItems = "center";
        closeMenu.style.justifyContent = "center";
        closeMenu.style.display = "flex";
        closeMenu.style.cursor = "pointer";
        closeMenu.style.transition = "all 0.15s ease-out";
        closeMenu.style.transform = "translate(-50%,25%)";
  
        //Animation stuffs
        closeMenu.onmouseenter = () => {
          closeMenu.style.transform = "translate(-50%,25%) scale(1.1,1.1)";
        };
  
        //More animation
        closeMenu.onmouseleave = () => {
          closeMenu.style.transform = "translate(-50%,25%) scale(1,1)";
        };
  
        //Just the close button
        closeMenu.onclick = () => {
          document.body.removeChild(bgFade);
          document.body.removeChild(shaderManager);
        };
  
        shaderManager.appendChild(closeMenu);
  
        //The close button for the menu
        const xImage = document.createElement("img");
        xImage.src =
          "data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3LjQ4IDcuNDgiPjxkZWZzPjxzdHlsZT4uY2xzLTF7ZmlsbDpub25lO3N0cm9rZTojZmZmO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2Utd2lkdGg6MnB4O308L3N0eWxlPjwvZGVmcz48dGl0bGU+aWNvbi0tYWRkPC90aXRsZT48bGluZSBjbGFzcz0iY2xzLTEiIHgxPSIzLjc0IiB5MT0iNi40OCIgeDI9IjMuNzQiIHkyPSIxIi8+PGxpbmUgY2xhc3M9ImNscy0xIiB4MT0iMSIgeTE9IjMuNzQiIHgyPSI2LjQ4IiB5Mj0iMy43NCIvPjwvc3ZnPg==";
  
        xImage.style.width = "0.75rem";
        xImage.style.height = "0.75rem";
        xImage.style.margin = "0.25rem";
        xImage.style.transform = "rotate(45deg)";
  
        closeMenu.appendChild(xImage);
  
        return {
          shaderPanel: shaderPanel,
          closeFunc: () => {
            document.body.removeChild(bgFade);
            document.body.removeChild(shaderManager);
          },
          resizeFunc: (width, height) => {
            shaderManager.style.aspectRatio = width + "/" + height;
            shaderManager.style.width = width > height ? "auto" : width + "%";
            shaderManager.style.height = height >= width ? "auto" : height + "%";
          },
          nameFunc: (name) => {
            topText.textContent = name;
          },
        };
      }
};