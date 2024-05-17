const extensionsGoHere = document.getElementById("extensionsGoHereLol");

document.body.className = window.matchMedia("(prefers-color-scheme: dark)")
  .matches
  ? "theme__Dark"
  : "theme__Light";

function addExtension(extensionJSON) {
  let extensionDiv = document.createElement("div");
  let hasSelectionDropdown = false;

  extensionDiv.className = "extension";

  let latestVersion = extensionJSON.versions
    ? extensionJSON.latestVersion ||
      extensionJSON.versions[extensionJSON.versions.length - 1].filename
    : "none";

  extensionDiv.innerHTML = `
        <div class="extension-banner">
            <img src="extensions/${extensionJSON.id}/thumbnail.${extensionJSON.thumbnailFormat || "svg"}" class="extension-image">
            <div class="extension-buttons">
                ${(function () {
                  if (extensionJSON.unavailable || !extensionJSON.versions)
                    return `<p class="prevent-select" style="background-color:#00000000; cursor: default;">Extension Unavailable. Sorry</p>`;

                  let bodyData = `<button id="${extensionJSON.id}_copy" data-copy="${window.location.href}extensions/${extensionJSON.id}/${latestVersion}">Copy URL</button>
                    <a id="${extensionJSON.id}_open" style="background-color:var(--Theme_Accent_1)" href="https://studio.penguinmod.com/editor.html?extension=${window.location.href}extensions/${extensionJSON.id}/${latestVersion}">Open in Penguinmod</a>`;

                  if (
                    extensionJSON.versions.length > 1 &&
                    !extensionJSON.hideVersionSelect
                  ) {
                    let options = ``;
                    hasSelectionDropdown = true;
                    extensionJSON.versions.forEach((version) => {
                      options += `<option value="${version.filename}">${version.name}</option>`;
                    });
                    bodyData += `\n<select id="${extensionJSON.id}_select" style="background-color:#ff8800; value=${latestVersion}">${options}</select>`;
                  }

                  //if (extensionJSON.turbowarpVersion) {
                  //  bodyData += `<a id="${extensionJSON.id}_open_TWVER" style="background-color:#ff6666" href="https://turbowarp.org/editor?extension=${extensionJSON.turbowarpVersion}">Open Turbowarp Version</a>`;
                  //}

                  return bodyData;
                })()}
            </div>
        </div>
        <h2 class="extensionName">${extensionJSON.name}</h2>
        <p class="extensionDescription" style="text-wrap: wrap;">${extensionJSON.description}</p>
    `;

  extensionsGoHere.appendChild(extensionDiv);

  if (hasSelectionDropdown) {
    const versionSelection = document.getElementById(
      `${extensionJSON.id}_select`,
    );
    const copyButton = document.getElementById(`${extensionJSON.id}_copy`);
    const openButton = document.getElementById(`${extensionJSON.id}_open`);

    versionSelection.addEventListener("change", (event) => {
      openButton.href = `https://studio.penguinmod.com/editor.html?extension=${window.location.href}extensions/${extensionJSON.id}/${versionSelection.value}`;
      copyButton.setAttribute(
        "data-copy",
        `${window.location.href}extensions/${extensionJSON.id}/${versionSelection.value}`,
      );
    });

    versionSelection.value = latestVersion;
  }
}

fetch("extensions.json")
  .then((response) => response.text())
  .then((text) => {
    let extensions = JSON.parse(text);
    console.log(extensions);

    for (let extensionID = 0; extensionID < extensions.length; extensionID++) {
      addExtension(extensions[extensionID]);
    }
  });
