const pendingRequests = new Map()

// WebExtensions API
// Add listener on browser messages (perform a postMessage from content.js towards userscript for messages received by extension.js popup)
browser.runtime.onMessage.addListener(message => {
  const id = +new Date()
  const p = new Promise(resolve => {
    pendingRequests.set(id, resolve)
  })
  window.postMessage({
    id,
    sender: 'gmgv_content',
    ...message,
  })
  return p
})

// Web API
// Add listener on messages from userscript
window.addEventListener('message', event => {
  if (event.source !== window) return // Only accept messages from current window
  if (event.data.sender !== 'gmgv_user') return // Only accept messages from userscript
  if ('type' in event.data &&  event.data.type == 'reflow') {
          browser.runtime.sendMessage("reflow")
	  return
  }
  
  const sendResponse = pendingRequests.get(event.data.id)
  pendingRequests.delete(event.data.id)
  delete event.data.id
  delete event.data.sender
  if (sendResponse) sendResponse(event.data)
})


// Inject userscript
var scripts = ['grid.user.js']
scripts.forEach(function(script) {
  var s = document.createElement('script')
  s.setAttribute('data-version', browser.runtime.getManifest().version)
  s.src = browser.extension.getURL(script)
  document.body.appendChild(s)
});

