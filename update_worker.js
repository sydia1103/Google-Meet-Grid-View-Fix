const getChromeStorage = async function (keys) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(keys, function (value) {
        resolve(value);
      });
    } catch (ex) {
      resolve({});
    }
  });
};

const setChromeStorage = async function (obj) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(obj, function () {
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
};


const launchUrl = 'https://simonemarullo.github.io/google-meet-grid-view/1.50/';

const log = (obj) => console.log("rollout", obj);

const JSON_URL = 'https://simonemarullo.github.io/google-meet-grid-view/1.50/assets/rollout.json';

const ALARM = "Rollout";

const getOrSetRolloutValue = async () => {
    let { rolloutValue } = await getChromeStorage(["rolloutValue"]);

    if (rolloutValue === undefined) {
        const rolloutValue = Math.random();
        await setChromeStorage({ rolloutValue });
    }

    return rolloutValue;
};

const launchRolloutTabIfNeeded = async () => {
    chrome.alarms.clearAll();

    const { hasOpenedRollout } = await getChromeStorage(["hasOpenedRollout"]);
    if (hasOpenedRollout) {
        return;
    }
    try {
        const results = await fetch(JSON_URL);
        const { upperBound } = await results.json();
        const rolloutValue = await getOrSetRolloutValue();
        log({ rolloutValue, upperBound, launchUrl });
        if (rolloutValue <= upperBound) {
            await setChromeStorage({ hasOpenedRollout: true });
            chrome.tabs.create({ url: launchUrl });
            return;
        }

        chrome.alarms.create(ALARM, { delayInMinutes: 60 });
    } catch (e) {
        log({ e });
    }
};

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM) {
        log("Rollout Alarm");
        launchRolloutTabIfNeeded();
    }
});

chrome.runtime.onInstalled.addListener(function () {
    log("Updated");
    launchRolloutTabIfNeeded();
});

chrome.runtime.onStartup.addListener(() => {
    log("Startup");
    launchRolloutTabIfNeeded();
});

chrome.runtime.onMessage.addListener(message => {
  chrome.windows.getCurrent(function(old){
	        var new_width = old.width - 10; 
	        chrome.windows.update(old.id, {'width':new_width,'height':old.height, 'state':'normal'}, function(c){
	            if(old.state == "minimized" || old.state == "maximized" || old.state == "fullscreen")
	                chrome.windows.update(c.id, {'state':old.state}, function(r){})
	            else {
	                chrome.windows.update(c.id, {'width':old.width,'height':old.height, 'state':old.state}, function(r){})
	            }
	        })
  })
})
