// Background script for Syndicate Vault extension
const chrome = window.chrome // Declare the chrome variable

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu items
  chrome.contextMenus.create({
    id: "saveToVault",
    title: "Save to Vault",
    contexts: ["page", "selection", "link", "image"],
  })

  chrome.contextMenus.create({
    id: "saveSelection",
    title: "Save selection to Vault",
    contexts: ["selection"],
  })

  chrome.contextMenus.create({
    id: "saveLink",
    title: "Save link to Vault",
    contexts: ["link"],
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveToVault" || info.menuItemId === "saveSelection" || info.menuItemId === "saveLink") {
    // Open popup or handle save directly
    chrome.action.openPopup()
  }
})

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup automatically
})
