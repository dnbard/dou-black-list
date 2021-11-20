type Stats = {
  stats: {
    registration: string;
    activities: Element[];
  };
};
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
const getAuthorElement = (comment: DouComment) =>
  comment.querySelectorAll(SELECTORS.author)[0] as HTMLAnchorElement;
const getAuthor = (comment: DouComment) => {
  return getAuthorElement(comment)?.href?.match(/users\/(.+)\//)?.[1];
};

const getStorage = (): Record<string, boolean> =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
const getUrl = (username) => `https://dou.ua/users/${username}/`;

(() => {
  const storage = getStorage();
  const index: Record<string, Array<DouComment> & Stats> = {};
  const isCommentFromBanned = (comment: DouComment) =>
    !!storage[getAuthor(comment)];

  function updateStorage(key, value) {
    storage[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  }

  function addBanButtonAndInfo(comment: DouComment) {
    const author = getAuthorElement(comment);
    if (!getAuthor(comment)) {
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
          addBanButtonAndInfo(comment);
          hideContentIfNeeded(comment);
        });
        console.log(`Updated ${commentsByAuthor.length} comments`);
      }
    };
    author.parentElement.appendChild(button);
    const infoBlock = document.createElement("span");
    const registration = document.createElement("span");
    const stats = index[getAuthor(comment)].stats;
    if (!stats) {
      return;
    }
    registration.innerHTML = stats.registration;
    infoBlock.appendChild(stats.activities[0]);
    infoBlock.appendChild(stats.activities[1]);
    infoBlock.appendChild(registration);
    infoBlock.className = "_ban_infoblock";
    author.parentElement.appendChild(infoBlock);
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
          addBanButtonAndInfo(comment);
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
        addBanButtonAndInfo(comment);
        comment.onclick = () => {};
      }
    }
  }

  async function indexOne(comment: DouComment) {
    const authorName = getAuthor(comment);
    if (!authorName) {
      return;
    }
    const text = getText(comment);
    if (!text) {
      return;
    }
    if (!index[authorName]) {
      index[authorName] = [] as typeof index[string];
    }
    index[authorName].push(comment);
    if (!index[authorName].stats) {
      index[authorName].stats = await fetchStats(authorName);
    }
  }

  async function fetchStats(username): Promise<Stats["stats"]> {
    const response = await fetch(getUrl(username));
    if (!response.ok) {
      return;
    }
    const text = await response.text();
    const html = document.createElement("html");
    html.innerHTML = text;
    return {
      registration: html
        .querySelectorAll<HTMLDivElement>(".status-info")[0]
        .innerText.replace(/\t/g, "")
        .trim()
        .split("\n")
        .slice(-1)[0],
      activities: (
        [
          ...html.querySelectorAll(".b-content-menu")[0].childNodes,
        ] as HTMLLIElement[]
      )
        .filter((e) => e.innerText)
        .slice(1, 3)
        .map((e) => e.children[0]),
    };
  }

  console.time(STORAGE_KEY);
  [...document.querySelectorAll(SELECTORS.comment)].forEach(
    async (comment: DouComment) => {
      await indexOne(comment);
      addBanButtonAndInfo(comment);
      hideContentIfNeeded(comment);
    }
  );
  console.timeEnd(STORAGE_KEY);
})();
