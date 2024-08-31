// Run after restarting to check the status of alarms
async function checkAlarmState() {
    chrome.storage.local.get(['notification']).then(result => {
        const notification = result['notification'] || {};
        const keys = Object.keys(notification);
        for (let key of keys) {
            const {contestName, startTime, endTime} = notification[key];
            chrome.alarms.getAll(function (alarms) {
                const alarm = alarms.find(alarm => alarm.name === contestName);
                if (!alarm) {
                    console.log(contestName);
                    // Recreate alarms if they are cleared after restarting
                    if (new Date(startTime) > Date.now()) {
                        chrome.alarms.create(contestName, {
                            when: (new Date(startTime)).getTime() - 20 * 60 * 1000
                        });
                    } else {
                        // Contest has started
                        chrome.alarms.create(contestName, {
                            when: Date.now()
                        });
                    }
                }
            })
        }
    });
}

checkAlarmState();

chrome.alarms.onAlarm.addListener((alarm) => {
    const contestName = alarm.name;
    chrome.storage.local.get(['notification']).then(result => {
        const notification = result['notification'] || {};
        if (notification && notification[contestName]) {
            const {startTime, endTime} = notification[contestName];
            let message = '';
            if (Date.now() < new Date(startTime)) {
                message = 'Contest will start soon.';
            } else if (new Date(startTime) < Date.now() && Date.now() < new Date(endTime)) {
                message = 'Contest has started.';
            }
            const contestUrl = `https://atcoder.jp/contests/${contestName}`;
            chrome.notifications.create('notificationId', {
                type: 'basic',
                iconUrl: '/icons/icon-128.png',
                title: `Contest ${contestName}`,
                message: message
            }, (notificationId) => {
                chrome.notifications.onClicked.addListener((notificationIdClicked) => {
                    if (notificationId === notificationIdClicked) {
                        chrome.tabs.create({url: contestUrl});
                    }
                });
            });
            delete notification[contestName];
            chrome.storage.local.set({notification: notification});
        }
    });

    chrome.alarms.clear(contestName, (wasCleared) => {
        if (wasCleared) {
            console.log(`Alarm cleared successfully. - ${contestName}`);
        } else {
            console.log(`Failed to clear the alarm. ${contestName}`);
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const {contestName, startTime, endTime} = message;
    if (message.action === 'subscribeNotification') {
        chrome.storage.local.get(['notification']).then(result => {
            let notification = result.notification || {};
            notification[contestName] = {
                contestName: contestName,
                startTime: startTime,
                endTime: endTime
            };
            chrome.storage.local.set({notification: notification});
        });

        chrome.alarms.create(contestName, {
            when: (new Date(startTime)).getTime() - 20 * 60 * 1000
        });
    } else if (message.action === 'unsubscribeNotification') {
        chrome.storage.local.get(['notification']).then(result => {
            let notification = result.notification || {};
            delete notification[contestName];
            chrome.storage.local.set({notification: notification});
        });

        chrome.alarms.clear(contestName, (wasCleared) => {
        });
    } else if (message.action === 'isNotificationOn') {
        chrome.storage.local.get(['notification']).then(result => {
            let notification = result.notification || {};
            sendResponse(notification[contestName] ?? false);
        });
    }
    // https://stackoverflow.com/questions/54126343/how-to-fix-unchecked-runtime-lasterror-the-message-port-closed-before-a-respon
    return true;
});
