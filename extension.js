(function(window){
    var comments = document.querySelectorAll('.comment'),
        localStorageKey = '__black_list',
        commentIsHiddenString = 'Комментарий скрыт',
        commentTitleAdd = 'Добавить в черный список',
        commentTitleRemove = 'Удалить из черного списка',
        blackList = JSON.parse(localStorage.getItem(localStorageKey) || '[]'),
        blackListIndexes = createBlackListIndexes(blackList),
        comment, authorElement, author, buttonNode;

    console.log('Black List %o', blackList);

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
                    buttonNode.onclick = getAddToBlackListHandler(author, comment);
                } else {
                    buttonNode.innerText = '-';
                    buttonNode.setAttribute('title', commentTitleRemove);

                    comment.querySelector('.b-post-author').appendChild(buttonNode);

                    comment.querySelector('.text').innerText = commentIsHiddenString;
                }
            }
        }
    }

    function getAddToBlackListHandler(author, comment){
        return function(event){
            var buttonNode = event.target;

            addToBlackList(author);
            comment.querySelector('.text').innerText = commentIsHiddenString;

            buttonNode.innerText = '-';
            buttonNode.setAttribute('title', commentTitleRemove);
        }
    }

    //function getRemoveFromBlackListHandler(author, comment){
    //    return function(event){
    //        var buttonNode = event.target;
    //        addToBlackList(author);
    //        comment.querySelector('.text').innerText = 'lol';
    //        buttonNode.innerText = '-';
    //    }
    //}

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
})(this);
