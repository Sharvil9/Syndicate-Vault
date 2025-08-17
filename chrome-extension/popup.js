// Popup script for Syndicate Vault extension
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("saveForm")
  const titleInput = document.getElementById("title")
  const excerptInput = document.getElementById("excerpt")
  const tagsInput = document.getElementById("tags")
  const spaceSelect = document.getElementById("space")
  const saveBtn = document.getElementById("saveBtn")
  const cancelBtn = document.getElementById("cancelBtn")
  const status = document.getElementById("status")

  // Quick action buttons
  const saveBookmark = document.getElementById("saveBookmark")
  const saveNote = document.getElementById("saveNote")
  const saveSelection = document.getElementById("saveSelection")
  const saveSnapshot = document.getElementById("saveSnapshot")

  let currentTab = null
  const vaultBaseUrl = "http://localhost:3000" // TODO: Make configurable

  // Declare chrome variable
  const chrome = window.chrome

  // Get current tab info
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    currentTab = tab

    // Set default title
    titleInput.value = tab.title || ""

    // Get selected text from content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "getSelection" })
      if (response && response.selectedText) {
        excerptInput.value = response.selectedText
      }
    } catch (error) {
      console.log("Could not get selection:", error)
    }
  } catch (error) {
    console.error("Error getting tab info:", error)
  }

  // Load user spaces (stub - would need authentication)
  spaceSelect.innerHTML = `
    <option value="00000000-0000-0000-0000-000000000001">Common Vault</option>
    <option value="personal">Personal Space</option>
  `

  // Quick actions
  saveBookmark.addEventListener("click", () => {
    // Pre-fill for bookmark
    if (currentTab) {
      titleInput.value = currentTab.title || ""
      excerptInput.value = ""
      tagsInput.value = "bookmark, web"
    }
  })

  saveNote.addEventListener("click", () => {
    // Pre-fill for note
    titleInput.value = "Note: " + (currentTab?.title || "New Note")
    excerptInput.focus()
    tagsInput.value = "note"
  })

  saveSelection.addEventListener("click", async () => {
    // Get selected text
    try {
      const response = await chrome.tabs.sendMessage(currentTab.id, { action: "getSelection" })
      if (response && response.selectedText) {
        titleInput.value = "Selection from " + currentTab.title
        excerptInput.value = response.selectedText
        tagsInput.value = "selection, quote"
      }
    } catch (error) {
      showStatus("Could not get selection", "error")
    }
  })

  saveSnapshot.addEventListener("click", () => {
    // Pre-fill for full page snapshot
    titleInput.value = currentTab?.title || ""
    excerptInput.value = "Full page snapshot"
    tagsInput.value = "snapshot, archive"
  })

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    if (!currentTab) {
      showStatus("No active tab found", "error")
      return
    }

    const formData = {
      title: titleInput.value.trim(),
      url: currentTab.url,
      excerpt: excerptInput.value.trim(),
      tags: tagsInput.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      space_id: spaceSelect.value,
    }

    if (!formData.title) {
      showStatus("Title is required", "error")
      return
    }

    saveBtn.disabled = true
    saveBtn.textContent = "Saving..."

    try {
      // Get page HTML for snapshot
      const response = await chrome.tabs.sendMessage(currentTab.id, { action: "getPageHTML" })
      const html = response?.html || ""

      // Save to vault
      const saveResponse = await fetch(`${vaultBaseUrl}/api/items/snapshot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          html,
        }),
      })

      const result = await saveResponse.json()

      if (saveResponse.ok) {
        showStatus(result.message || "Saved successfully!", "success")
        setTimeout(() => window.close(), 1500)
      } else {
        throw new Error(result.error || "Failed to save")
      }
    } catch (error) {
      console.error("Save error:", error)
      showStatus(error.message || "Failed to save", "error")
    } finally {
      saveBtn.disabled = false
      saveBtn.textContent = "Save"
    }
  })

  cancelBtn.addEventListener("click", () => {
    window.close()
  })

  function showStatus(message, type) {
    status.textContent = message
    status.className = `status ${type}`
    status.style.display = "block"

    if (type === "success") {
      setTimeout(() => {
        status.style.display = "none"
      }, 3000)
    }
  }
})
