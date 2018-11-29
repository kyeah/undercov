chrome.browserAction.onClicked.addListener(function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id!, { action: 'BROWSER_ACTION_CLICKED' }, (response: any) => {
      if (response.action === 'REQUEST_NOTIFICATION') {
        chrome.notifications.create('', response.options)
      }
    })
  })
})

chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.action === 'REQUEST_NOTIFICATION') {
    chrome.notifications.create('', msg.options)
  }
})
