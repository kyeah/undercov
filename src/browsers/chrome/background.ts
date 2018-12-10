let permissionNotifIds: any = {}

chrome.runtime.onMessage.addListener(function(msg, { }, sendResponse) {
  if (msg.action === 'REQUEST_NOTIFICATION') {
    chrome.notifications.create('', msg.options)
  } else if (msg.action === 'REQUEST_PERMISSION') {
    chrome.permissions.contains({ origins: [msg.origin] }, function(result) {
      if (!result) {
        chrome.notifications.create(
          '',
          {
            type: 'basic',
            iconUrl: 'resources/18dp.png',
            title: 'undercov',
            message: `Allow access to code coverage at ${msg.origin}?`,
            buttons: [{
              title: 'Allow'
            }]
          },
          function(id: any) {
            permissionNotifIds[id] = {
              origin: msg.origin,
              sendResponse
            }
          }
        )
      } else {
        sendResponse(false)
      }
    })
    return true
  }
  return false
})

chrome.notifications.onButtonClicked.addListener(function(id: any, btnIdx) {
  const notifInfo = permissionNotifIds[id]
  if (notifInfo && btnIdx === 0) {
    chrome.permissions.request({ origins: [notifInfo.origin] }, function(granted) {
      notifInfo.sendResponse(granted)
    })
  }
})
