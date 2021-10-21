type DouComment = HTMLElement;

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
const getTextElement = (comment: DouComment) =>
  comment.querySelectorAll(SELECTORS.text)[0] as HTMLElement;
const getText = (comment: DouComment) => getTextElement(comment).innerText;
const getAuthorElement = (comment: DouComment): HTMLElement =>
  comment.querySelectorAll(SELECTORS.author)[0] as HTMLElement;
const getAuthor = (comment: DouComment) =>
  getAuthorElement(comment)?.innerText.trim();

const getStorage = (): Record<string, boolean> =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

function updateStorage(key, value) {
  const storage = getStorage();
  storage[key] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

(() => {
  const storage = getStorage();
  const index: Record<string, Array<DouComment>> = {};
  const isCommentFromBanned = (comment: DouComment) =>
    !!storage[getAuthor(comment)];

  function addBanButton(comment: DouComment) {
    const author = getAuthorElement(comment);
    if (!author) {
      return;
    }
    const existingBanButton =
      author.parentElement.querySelectorAll("._ban_button")[0];
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
      const yes = confirm(
        `${isCommentFromBanned(comment) ? "unban" : "ban"} ${authorName}?`
      );
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

  function hideContentIfNeeded(comment: DouComment) {
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
          // unhide
          comment.removeAttribute("data-banned");
          comment.innerHTML = content;
          addBanButton(comment);
          comment.onclick = () => {};
        } else {
          // hide again
          comment.setAttribute("data-banned", comment.innerHTML);
          comment.innerHTML = HIDDEN_COMMENT;
        }
      };
    } else {
      // unban clicked
      const content = comment.getAttribute("data-banned");
      if (content) {
        comment.removeAttribute("data-banned");
        comment.innerHTML = content;
        addBanButton(comment);
        comment.onclick = () => {};
      }
    }
  }

  function indexOne(comment: DouComment) {
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
  [...document.querySelectorAll(SELECTORS.comment)].forEach(
      (comment: DouComment) => {
        indexOne(comment);
        addBanButton(comment);
        hideContentIfNeeded(comment);
      }
  );
  console.timeEnd(STORAGE_KEY);
})();
