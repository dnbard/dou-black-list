const SETTINGS_SELECTORS = {
  userProfile: ".min-profile",
  aboutUser: ".b-user-info",
};

const exportId = STORAGE_KEY + "export";
const importId = STORAGE_KEY + "import";
const importIdFile = STORAGE_KEY + "import_file";

function getSettingsHtml(settings) {
  // language=HTML
  return `
    <h3>Dou Block List Settings</h3>
    <p>
        Currently, there are ${
          Object.keys(settings).length
        } folks in the ban list.
    </p>
    <p>
      <label>
        <button type="button" id="${exportId}">📩</button>
        Export block list as json file
      </label>
    </p>
    <p>
      <input type="file" style="display: none" id="${importIdFile}">
      <label>
        <button type="button" id="${importId}">📤</button>
        Import block list from json file
      </label>
    </p>
  `;
}

function isOnSettingsPage() {
  const minProfile = document.querySelectorAll(
    SETTINGS_SELECTORS.userProfile
  )[0] as HTMLAnchorElement;
  return (
    minProfile.tagName === "A" && minProfile.href === document.location.href
  );
}

function getOnFileUpload(importFileInput) {
  return () => {
    const fr = new FileReader();

    fr.onload = function (e) {
      const result = JSON.parse(e.target.result.toString());
      updateStorageWithSettings(result);
    };
    fr.readAsText(importFileInput.files.item(0));
  };
}

function attachEventListeners(injectElement) {
  const exportButton: HTMLButtonElement = injectElement.querySelector(
    `#${exportId}`
  );
  const importButton: HTMLButtonElement = injectElement.querySelector(
    `#${importId}`
  );
  const importFileInput: HTMLInputElement = injectElement.querySelector(
    `#${importIdFile}`
  );
  exportButton.onclick = downloadSettings;
  importButton.onclick = openUploadDialog;
  importFileInput.onchange = getOnFileUpload(importFileInput);
}

function getInjectElement() {
  const aboutUser = document.querySelectorAll(SETTINGS_SELECTORS.aboutUser)[0];
  return aboutUser.parentElement;
}

function renderSettings(settings) {
  const settingsElement = document.createElement("article");
  settingsElement.className = "b-typo";
  settingsElement.id = STORAGE_KEY;
  settingsElement.innerHTML = getSettingsHtml(settings);
  const injectElement = getInjectElement();
  const existingSettings = injectElement.querySelectorAll(`#${STORAGE_KEY}`)[0];
  if (existingSettings) {
    injectElement.removeChild(existingSettings);
  }
  injectElement.appendChild(settingsElement);
  attachEventListeners(injectElement);
}

function openUploadDialog() {
  document.getElementById(importIdFile).click();
}

function updateStorageWithSettings(settings) {
  if (!ensureSettings(settings)) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  renderSettings(getStorage());
}

function ensureSettings(settings) {
  return Object.entries(settings).every(
    ([key, value]) => key !== "undefined" && typeof value === "boolean"
  );
}

function downloadSettings() {
  const storage = getStorage();
  const json: string = JSON.stringify(storage, null, 2);
  const blob = new Blob([json], { type: "octet/stream" });
  const a = document.createElement("a");
  a.href = window.URL.createObjectURL(blob);
  a.download = `dou-block-list-${Object.keys(storage).length}-items.json`;
  a.setAttribute("style", "display: none;");
  a.rel = "noopener noreferrer";
  a.click();
}

(() => {
  if (!isOnSettingsPage()) {
    return;
  }
  renderSettings(getStorage());
})();
