type DouComment = HTMLElement;

const SELECTORS = {
  comment: ".comment",
  author: ".b-post-author > a",
  text: ".comment_text",
  expand: ".expand-thread",
  link: ".comment-link",
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
function getTextElement(comment: DouComment) {
  return comment.querySelectorAll(SELECTORS.text)[0] as HTMLElement;
}
function getText(comment: DouComment) {
  return getTextElement(comment).innerText;
}
function getAuthorElement(comment: DouComment): HTMLElement {
  return comment.querySelectorAll(SELECTORS.author)[0] as HTMLElement;
}
function getAuthor(comment: DouComment) {
  return getAuthorElement(comment)?.innerText.trim();
}
function getLink(comment: DouComment) {
  return comment.querySelectorAll(SELECTORS.link)[0] as HTMLElement;
}
(function () {
  const storage: Record<string, boolean> = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "{}"
  );
  const index: Record<string, Array<DouComment>> = {};

  function updateStorage(key, value) {
    storage[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  }

  function readAllComments(): DouComment[] {
    // @ts-ignore
    return [...document.querySelectorAll(SELECTORS.comment)];
  }

  function isCommentFromBanned(comment: DouComment) {
    return !!storage[getAuthor(comment)];
  }

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
  readAllComments().forEach((comment) => {
    indexOne(comment);
    addBanButton(comment);
    hideContentIfNeeded(comment);
  });
})();
