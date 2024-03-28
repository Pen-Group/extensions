const extensionsGoHere = document.getElementById("extensionsGoHereLol");

function addExtension(extensionJSON) {
    let extensionDiv = document.createElement("div");
    extensionDiv.className = "extension";

    extensionDiv.innerHTML = `
        <div class="extension-banner">
            <img src="extensions/${extensionJSON.id}/thumbnail.svg" class="extension-image">
            <div class="extension-buttons">
                <button class="copy" data-copy="${window.location.href}/extensions/${extensionJSON.id}/${extensionJSON.latestVersion}">Copy URL</button>
                <a class="open" href="https://turbowarp.org/editor?extension=https://extensions.turbowarp.org/obviousAlexC/SensingPlus.js">Open Extension</a>
            </div>
        </div>
        <h2 class="extensionName">${extensionJSON.name}</h2>
        <p class="extensionDescription" style="text-wrap: wrap;">${extensionJSON.description}</p>
    `;

    extensionsGoHere.appendChild(extensionDiv);
}

fetch("extensions.json").then((response) => response.text())
.then((text) => {
    let extensions = JSON.parse(text);
    console.log(extensions);

    for (let extensionID = 0; extensionID < extensions.length; extensionID++) {
        addExtension(extensions[extensionID]);
    }
});