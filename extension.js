const SELECTORS = {
    comment: ".comment",
    author: ".b-post-author > a",
    text: ".comment_text",
};
const STORAGE_KEY = "__dou_black_list__";
const HIDDEN_COMMENT = `<div class="_banned">
  <div class="b-post-author">
    <a class="avatar">
      <img
        class="g-avatar"
        alt="avatar"
        src="https://s.dou.ua/img/avatars/80x80_966.png"
        width="25"
        height="25"
      />
      Banned user
    </a>
  </div>

  <div class="comment_text b-typo">Hidden content, click to show</div>
</div>
`;
const getTextElement = (comment) => comment.querySelectorAll(SELECTORS.text)[0];
const getText = (comment) => getTextElement(comment).innerText;
const getAuthorElement = (comment) => comment.querySelectorAll(SELECTORS.author)[0];
const getAuthor = (comment) => {
    return getAuthorElement(comment)?.href?.match(/users\/(.+)\//)?.[1];
};
const getStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
(() => {
    const storage = getStorage();
    const index = {};
    const isCommentFromBanned = (comment) => !!storage[getAuthor(comment)];
    function updateStorage(key, value) {
        storage[key] = value;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    }
    function addBanButton(comment) {
        const author = getAuthorElement(comment);
        if (!getAuthor(comment)) {
            return;
        }
        const existingBanButton = author.parentElement.querySelectorAll("._ban_button")[0];
        if (existingBanButton) {
            author.parentElement.removeChild(existingBanButton);
        }
        const button = document.createElement("button");
        button.classList.add("_ban_button");
        button.innerText = isCommentFromBanned(comment) ? "😇" : "🤡";
        button.title = isCommentFromBanned(comment) ? "unban" : "ban";
        button.onclick = (e) => {
            e.stopPropagation();
            const authorName = getAuthor(comment);
            const yes = confirm(`${isCommentFromBanned(comment) ? "unban" : "ban"} ${authorName}?`);
            if (yes) {
                updateStorage(authorName, !storage[authorName]);
                const commentsByAuthor = index[authorName];
                commentsByAuthor.forEach((comment) => {
                    addBanButton(comment);
                    hideContentIfNeeded(comment);
                });
                console.log(`Updated ${commentsByAuthor.length} comments`);
            }
        };
        author.parentElement.appendChild(button);
    }
    function hideContentIfNeeded(comment) {
        const text = getTextElement(comment);
        if (!text) {
            return;
        }
        if (isCommentFromBanned(comment)) {
            comment.setAttribute("data-banned", comment.innerHTML);
            comment.innerHTML = HIDDEN_COMMENT;
            comment.onclick = (e) => {
                e.stopPropagation();
                const content = comment.getAttribute("data-banned");
                if (content) {
                    comment.removeAttribute("data-banned");
                    comment.innerHTML = content;
                    addBanButton(comment);
                    comment.onclick = () => { };
                }
                else {
                    comment.setAttribute("data-banned", comment.innerHTML);
                    comment.innerHTML = HIDDEN_COMMENT;
                }
            };
        }
        else {
            const content = comment.getAttribute("data-banned");
            if (content) {
                comment.removeAttribute("data-banned");
                comment.innerHTML = content;
                addBanButton(comment);
                comment.onclick = () => { };
            }
        }
    }
    function indexOne(comment) {
        const authorName = getAuthor(comment);
        if (!authorName) {
            return;
        }
        const text = getText(comment);
        if (!text) {
            return;
        }
        if (!index[authorName]) {
            index[authorName] = [];
        }
        index[authorName].push(comment);
    }
    console.time(STORAGE_KEY);
    [...document.querySelectorAll(SELECTORS.comment)].forEach((comment) => {
        indexOne(comment);
        addBanButton(comment);
        hideContentIfNeeded(comment);
    });
    console.timeEnd(STORAGE_KEY);
})();
const SETTINGS_SELECTORS = {
    userProfile: ".min-profile",
    aboutUser: ".b-user-info",
};
const exportId = STORAGE_KEY + "export";
const importId = STORAGE_KEY + "import";
const importIdFile = STORAGE_KEY + "import_file";
function getSettingsHtml(settings) {
    return `
    <h3>Dou Block List Settings</h3>
    <p>
        Currently, there are ${Object.keys(settings).length} folks in the ban list.
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
    const minProfile = document.querySelectorAll(SETTINGS_SELECTORS.userProfile)[0];
    return (minProfile.tagName === "A" && minProfile.href === document.location.href);
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
    const exportButton = injectElement.querySelector(`#${exportId}`);
    const importButton = injectElement.querySelector(`#${importId}`);
    const importFileInput = injectElement.querySelector(`#${importIdFile}`);
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
    return (!Array.isArray(settings) &&
        typeof settings === "object" &&
        Object.keys(settings).every((key) => key !== "undefined"));
}
function downloadSettings() {
    const storage = getStorage();
    const json = JSON.stringify(storage, null, 2);
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
