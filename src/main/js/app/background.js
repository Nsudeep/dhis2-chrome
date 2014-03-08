chrome.app.runtime.onLaunched.addListener(function(launchData) {
    chrome.app.window.create('../../index.html', {
        id: 'DHIS2',
        state: 'fullscreen'
    });
});

chrome.runtime.onInstalled.addListener(function() {
    console.log('DHIS2 Chrome extension installed successfully.');
});