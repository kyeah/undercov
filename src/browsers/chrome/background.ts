chrome.runtime.onMessage.addListener(function(msg, { }, sendResponse) {
  if (msg.action === 'REQUEST_NOTIFICATION') {
    chrome.notifications.create('', msg.options)
  } else if (msg.action === 'REQUEST_PERMISSION') {
    chrome.permissions.contains({
      origins: [msg.origin]
    }, function(result) {
      if (!result) {
        console.log('not contains permission')
        console.log(msg.origin)
        let notifId: any = null
        console.log('sending notif')
        chrome.notifications.create('', {
          type: 'basic',
          iconUrl: 'resources/18dp.png',
          title: 'undercov',
          message: `Allow access to code coverage at ${msg.origin}?`,
          buttons: [{
            title: 'Allow'
          }]
        }, function(id: any) {
          notifId = id
        })
        chrome.notifications.onButtonClicked.addListener(function(id: any, btnIdx) {
          console.log('received notif')
          if (id === notifId) {
            if (btnIdx === 0) {
              chrome.permissions.request({
                origins: [msg.origin]
              }, function(granted) {
                console.log('granted:', granted)
                sendResponse(granted)
              })
            }
          }
        })
      } else {
        console.log('contains permission')
        console.log(msg.origin)
        sendResponse(false)
      }
    })
    return true
  }
  return false
})
