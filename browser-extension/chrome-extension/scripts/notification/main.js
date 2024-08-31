const getStartTime = () => {
    const regex = /startTime\s=\smoment\("(.*)"\)/gm;
    let startTimeStr = '';
    for (let i = 0; i < document.scripts.length; i++) {
        const match = regex.exec(document.scripts[i].text);
        if (match) {
            startTimeStr = match[1];
        }
    }
    return startTimeStr;
}

const getEndTime = () => {
    const regex = /endTime\s=\smoment\("(.*)"\)/gm;
    let endTimeStr = '';
    for (let i = 0; i < document.scripts.length; i++) {
        const match = regex.exec(document.scripts[i].text);
        if (match) {
            endTimeStr = match[1];
        }
    }
    return endTimeStr;
}

const hasContestStarted = () => {
    const startTimeStr = getStartTime();
    if (startTimeStr) {
        const startTime = new Date(startTimeStr);
        const now = new Date();
        return startTime <= now;
    }
    return true;
}

const getContestName = () => {
    const regex = /contestScreenName\s=\s"(.*)"/gm;
    for (let i = 0; i < document.scripts.length; i++) {
        const match = regex.exec(document.scripts[i].text);
        if (match) {
            return match[1];
        }
    }
    return '';
}

const addSubscribeBtn = () => {
    const subscribeBtn = $('<a/>', {
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5"><g transform="rotate(0 12 3)"><path d="M12 3v2"/><path fill="black" fill-opacity="0" d="M12 5c-3.31 0 -6 2.69 -6 6l0 6c-1 0 -2 1 -2 2h8M12 5c3.31 0 6 2.69 6 6l0 6c1 0 2 1 2 2h-8"/></g><path d="M10 20c0 1.1 0.9 2 2 2c1.1 0 2 -0.9 2 -2" transform="rotate(0 12 8)"/></g></svg>',
        id: 'subscribe-btn',
        click: () => {
            const message = {
                action: 'subscribeNotification',
                contestName: getContestName(),
                startTime: getStartTime(),
                endTime: getEndTime()
            };
            chrome.runtime.sendMessage(message, (_) => {});
            addUnsubscribeBtn();
        }
    });
    $('#unsubscribe-btn').remove();
    $('h1.text-center').append(subscribeBtn);
}

const addUnsubscribeBtn = () => {
    const unsubscribeBtn = $('<a/>', {
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><g><path stroke-dasharray="4" stroke-dashoffset="4" d="M12 3v2"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.15s" values="4;0"/></path><path fill="black" fill-opacity="0" stroke-dasharray="32" stroke-dashoffset="32" d="M12 5c-3.31 0 -6 2.69 -6 6l0 6c-1 0 -2 1 -2 2h8M12 5c3.31 0 6 2.69 6 6l0 6c1 0 2 1 2 2h-8"><animate fill="freeze" attributeName="fill-opacity" begin="0.675s" dur="0.112s" values="0;1"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.15s" dur="0.3s" values="32;0"/></path><animateTransform fill="freeze" attributeName="transform" begin="0.675s" dur="4.5s" keyTimes="0;0.05;0.15;0.2;1" type="rotate" values="0 12 3;3 12 3;-3 12 3;0 12 3;0 12 3"/></g><path stroke-dasharray="8" stroke-dashoffset="8" d="M10 20c0 1.1 0.9 2 2 2c1.1 0 2 -0.9 2 -2"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.45s" dur="0.15s" values="8;0"/><animateTransform fill="freeze" attributeName="transform" begin="0.825s" dur="4.5s" keyTimes="0;0.05;0.15;0.2;1" type="rotate" values="0 12 8;6 12 8;-6 12 8;0 12 8;0 12 8"/></path></g></svg>',
        id: 'unsubscribe-btn',
        click: () => {
            const message = {
                action: 'unsubscribeNotification',
                contestName: getContestName(),
                startTime: getStartTime(),
                endTime: getEndTime()
            };
            chrome.runtime.sendMessage(message, (_) => {});
            addSubscribeBtn();
        }
    });
    $('#subscribe-btn').remove();
    $('h1.text-center').append(unsubscribeBtn);
}

if (!hasContestStarted()) {
    const message = {
        action: 'isNotificationOn',
        contestName: getContestName(),
        startTime: getStartTime(),
        endTime: getEndTime()
    };
    chrome.runtime.sendMessage(message, isNotificationOn => {
        if (isNotificationOn) {
            addUnsubscribeBtn();
        } else {
            addSubscribeBtn();
        }
    });
}
