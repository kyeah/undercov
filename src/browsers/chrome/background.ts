chrome.runtime.onMessage.addListener(function(msg) {
  if (msg.action === 'REQUEST_NOTIFICATION') {
    chrome.notifications.create('', msg.options)
  }
})
