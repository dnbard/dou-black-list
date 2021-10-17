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
const getAuthor = (comment) => getAuthorElement(comment)?.innerText.trim();
(() => {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const index = {};
    const isCommentFromBanned = (comment) => !!storage[getAuthor(comment)];
    function updateStorage(key, value) {
        storage[key] = value;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    }
    function addBanButton(comment) {
        const author = getAuthorElement(comment);
        if (!author) {
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
    [...document.querySelectorAll(SELECTORS.comment)].forEach((comment) => {
        indexOne(comment);
        addBanButton(comment);
        hideContentIfNeeded(comment);
    });
})();
const SETTINGS_SELECTORS = {
    userProfile: ".min-profile",
    aboutUser: ".b-user-info",
};
const SETTINGS_KEY = "__dou_black_list__settings__";
const exportId = SETTINGS_KEY + "export";
const importId = SETTINGS_KEY + "import";
const importIdFile = SETTINGS_KEY + "import_file";
function isOnSettingsPage() {
    const minProfile = document.querySelectorAll(SETTINGS_SELECTORS.userProfile)[0];
    return (minProfile.tagName === "A" && minProfile.href === document.location.href);
}
const getInjectElement = () => {
    const aboutUser = document.querySelectorAll(SETTINGS_SELECTORS.aboutUser)[0];
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
function download(json) {
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
    injectWhere.querySelector(`#${exportId}`).onclick = () => download(JSON.stringify({}));
    injectWhere.querySelector(`#${importId}`).onclick = openDialog;
    injectWhere.querySelector(`#${importIdFile}`).onchange = () => {
        const fr = new FileReader();
        fr.onload = function (e) {
            const result = JSON.parse(e.target.result);
            console.log(result);
        };
        fr.readAsText(injectWhere.querySelector(`#${importIdFile}`).files.item(0));
    };
})();
