// Content script for Syndicate Vault extension
;(() => {
  // Declare chrome variable
  const chrome = window.chrome

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSelection") {
      const selectedText = window.getSelection().toString().trim()
      sendResponse({ selectedText })
    } else if (request.action === "getPageHTML") {
      const html = document.documentElement.outerHTML
      sendResponse({ html })
    }
    return true // Keep message channel open for async response
  })

  // Add context menu functionality (handled by background script)
  // This content script mainly serves as a bridge for data extraction
})()
