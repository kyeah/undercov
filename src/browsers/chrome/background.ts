// Storage for permission requests.
let permissionNotifIds: { [id: string]: { origin: string, sendResponse: any } } = {}

chrome.runtime.onMessage.addListener(function(msg, { }, sendResponse) {
  switch (msg.action) {
    case 'REQUEST_NOTIFICATION':
      chrome.notifications.create('', msg.options)
      return false
    case 'REQUEST_PERMISSION':
      chrome.permissions.contains({ origins: [msg.origin] }, function(hasPermission) {
        if (hasPermission) {
          sendResponse(true)
          return
        }

        // Route the permission request through a notification button
        // to adhere to Chrome's security policies.
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
      })

      // indicate to the messenger that sendResponse should not be
      // deallocated before it is called by our asynchronous permissions check.
      return true
  }

  return false
})

// Add a notification button listener to complete the permission request transaction.
chrome.notifications.onButtonClicked.addListener(function(id: any, btnIdx) {
  const notifInfo = permissionNotifIds[id]
  if (notifInfo) {
    if (btnIdx === 0) {
      chrome.permissions.request({ origins: [notifInfo.origin] }, function(granted) {
        notifInfo.sendResponse(granted)
      })
    } else {
      notifInfo.sendResponse(false)
    }
  }
})
