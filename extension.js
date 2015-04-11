(function(window){
    var comments = document.querySelectorAll('.comment'),
        article = document.querySelector('.b-content-page') || document.querySelector('.cell.g-right-shadowed.mobtab-maincol'),
        localStorageKey = '__black_list',
        commentIsHiddenString = 'Комментарий скрыт',
        articleIsHiddenString = 'Статья скрыта',
        commentTitleAdd = 'Добавить в черный список',
        commentTitleRemove = 'Удалить из черного списка',
        blackList = JSON.parse(localStorage.getItem(localStorageKey) || '[]'),
        blackListIndexes = createBlackListIndexes(blackList),
        comment, authorElement, author, buttonNode, textNode, articleAuthor, articleNode;

    console.log('Black List %o', blackList);

    if (article){
        articleAuthor = article.querySelector('.author .name a').innerText;

        if (isInBlackList(articleAuthor)){
            articleNode = article.querySelector('article.b-typo');
            articleNode.setAttribute('data-hidden', 'true');
            articleNode.setAttribute('data-text', articleNode.innerText);
            articleNode.innerText = articleIsHiddenString;
            articleNode.classList.add('comment-hidden');
        } else {
            buttonNode = document.createElement('BUTTON');
            buttonNode.setAttribute('class', 'list-action');
            buttonNode.innerText = '+';
            buttonNode.setAttribute('title', commentTitleAdd);

            article.querySelector('.author .name').appendChild(buttonNode);
            buttonNode.onclick = function(event){
                articleNode = article.querySelector('article.b-typo');
                articleNode.setAttribute('data-hidden', 'true');
                articleNode.setAttribute('data-text', articleNode.innerText);
                articleNode.innerText = articleIsHiddenString;
                articleNode.classList.add('comment-hidden');

                addToBlackList(articleAuthor);
                hideAllCommentsByAuthor(articleAuthor);

                event.target.style.display = "none";
            }
        }
    }

    if (comments.length > 0){
        for(var i = 0; i < comments.length; i ++){
            comment = comments[i];
            authorElement = comment.querySelector('.avatar');

            if (authorElement){
                author = authorElement.innerText;
                buttonNode = document.createElement('BUTTON');
                buttonNode.setAttribute('class', 'list-action');

                if (!isInBlackList(author)){
                    buttonNode.innerText = '+';
                    buttonNode.setAttribute('title', commentTitleAdd);

                    comment.querySelector('.b-post-author').appendChild(buttonNode);
                    buttonNode.onclick = getAddToBlackListHandler(author);
                } else {
                    buttonNode.innerText = '-';
                    buttonNode.setAttribute('title', commentTitleRemove);

                    comment.querySelector('.b-post-author').appendChild(buttonNode);
                    buttonNode.onclick = getRemoveFromBlackListHandler(author);

                    hideComment(comment.querySelector('.text'));
                }
            }
        }
    }

    function isCommentHidden(commentText){
        return commentText.getAttribute('data-hidden') === 'true';
    }

    function hideComment(commentText){
        if (isCommentHidden(commentText)){
            return;
        }

        commentText.setAttribute('data-hidden', 'true');
        commentText.setAttribute('data-text', commentText.innerText);
        commentText.innerText = commentIsHiddenString;
        commentText.classList.add('comment-hidden');
    }

    function showComment(commentText){
        if (!isCommentHidden(commentText)){
            return;
        }

        commentText.innerText = commentText.getAttribute('data-text');
        commentText.setAttribute('data-hidden', 'false');
        commentText.setAttribute('data-text', '');
        commentText.classList.remove('comment-hidden');
    }

    function hideAllCommentsByAuthor(authorName){
        if (comments.length > 0){
            for(var i = 0; i < comments.length; i ++){
                comment = comments[i];
                authorElement = comment.querySelector('.avatar');
                if (authorElement){
                    author = authorElement.innerText;

                    if (author === authorName){
                        hideComment(comment.querySelector('.text'));
                        buttonNode = comment.querySelector('.list-action');

                        buttonNode.innerText = '-';
                        buttonNode.setAttribute('title', commentTitleRemove);
                        buttonNode.onclick = getRemoveFromBlackListHandler(authorName);
                    }
                }
            }
        }
    }

    function showAllCommentsByAuthor(authorName){
        if (comments.length > 0){
            for(var i = 0; i < comments.length; i ++){
                comment = comments[i];
                authorElement = comment.querySelector('.avatar');
                if (authorElement){
                    author = authorElement.innerText;

                    if (author === authorName){
                        showComment(comment.querySelector('.text'));
                        buttonNode = comment.querySelector('.list-action');

                        buttonNode.innerText = '+';
                        buttonNode.setAttribute('title', commentTitleAdd);
                        buttonNode.onclick = getAddToBlackListHandler(authorName);
                    }
                }
            }
        }
    }

    function getAddToBlackListHandler(author){
        return function(event){
            var buttonNode = event.target;

            addToBlackList(author);
            hideAllCommentsByAuthor(author);
        }
    }

    function getRemoveFromBlackListHandler(author){
        return function(event){
            removeFromBlackList(author);
            showAllCommentsByAuthor(author)
        }
    }

    function isInBlackList(author){
        return !!blackListIndexes[author];
    }

    function createBlackListIndexes(blackList){
        var blackListIndexes = {};

        if (typeof blackList !== 'object' || typeof blackList.length !== 'number'){
            throw new Error('Invalid argument: blackList must be an array');
        }

        for(var i = 0; i < blackList.length; i ++){
            blackListIndexes[blackList[i]] = true;
        }

        return blackListIndexes;
    }

    function addToBlackList(author){
        if (isInBlackList(author)){
            return;
        }

        blackListIndexes[author] = true;
        blackList.push(author);
        localStorage.setItem(localStorageKey, JSON.stringify(blackList));

        console.log('BLACK LIST >> %s added', author);
    }

    function removeFromBlackList(author){
        var index;

        if (!isInBlackList(author)){
            return;
        }

        blackListIndexes[author] = false;

        index = blackList.indexOf(author);
        blackList.splice(index, 1);
        localStorage.setItem(localStorageKey, JSON.stringify(blackList));

        console.log('BLACK LIST >> %s removed', author);
    }
})(this);
