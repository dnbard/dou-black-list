const SETTINGS_SELECTORS = {
  userProfile: ".min-profile",
  aboutUser: ".b-user-info",
};

const SETTINGS_KEY = "__dou_black_list__settings__";
const exportId = SETTINGS_KEY + "export";
const importId = SETTINGS_KEY + "import";
const importIdFile = SETTINGS_KEY + "import_file";

function isOnSettingsPage() {
  const minProfile = document.querySelectorAll(
    SETTINGS_SELECTORS.userProfile
  )[0] as HTMLAnchorElement;
  return (
    minProfile.tagName === "A" && minProfile.href === document.location.href
  );
}

const getInjectElement = () => {
  const aboutUser = document.querySelectorAll(SETTINGS_SELECTORS.aboutUser)[0];
  // @ts-ignore
  return aboutUser.parentElement;
};

const renderSettings = (settings) => {
  const el = document.createElement("div");
  el.innerHTML = `
<form>
    <label>
        <input type="checkbox" name="set1" checked>
        set1
    </label>
    <button type="button" id="${exportId}">
        Export block list as json file
    </button>
    <input type="file" style="display: none" id="${importIdFile}">
    <button type="button" id="${importId}">
        Import block list from json file
    </button>
</form>
    `;
  return el;
};

function openDialog() {
  document.getElementById(importIdFile).click();
}

function download(json: string) {
  const blob = new Blob([json], { type: "octet/stream" });
  const url = window.URL.createObjectURL(blob);
  window.location.assign(url);
}

(() => {
  if (!isOnSettingsPage()) {
    return;
  }
  const injectWhere = getInjectElement();
  injectWhere.appendChild(renderSettings({}));

  // @ts-ignore
    injectWhere.querySelector(`#${exportId}`).onclick = () =>
        download(JSON.stringify({}));
    // @ts-ignore
    injectWhere.querySelector(`#${importId}`).onclick = openDialog;
    // @ts-ignore
    injectWhere.querySelector(`#${importIdFile}`).onchange = () => {

        const fr = new FileReader();

        fr.onload = function(e) {
            // @ts-ignore
            const result = JSON.parse(e.target.result);
            console.log(result)
        }
        // @ts-ignore
        fr.readAsText(injectWhere.querySelector(`#${importIdFile}`).files.item(0));
    }
})();
