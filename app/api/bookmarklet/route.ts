import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const baseUrl = searchParams.get("base_url") || request.headers.get("origin") || "http://localhost:3000"

  // Generate bookmarklet JavaScript
  const bookmarkletCode = `
(function() {
  // Check if vault capture overlay already exists
  if (document.getElementById('vault-capture-overlay')) {
    return;
  }

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'vault-capture-overlay';
  overlay.style.cssText = \`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  \`;

  // Create capture form
  const form = document.createElement('div');
  form.style.cssText = \`
    background: #1e293b;
    border-radius: 12px;
    padding: 24px;
    width: 90%;
    max-width: 500px;
    color: white;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  \`;

  // Get page data
  const pageTitle = document.title || window.location.hostname;
  const pageUrl = window.location.href;
  const selectedText = window.getSelection().toString().trim();
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

  form.innerHTML = \`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0; color: #a855f7; font-size: 18px;">Save to Vault</h2>
      <button id="vault-close" style="background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer;">&times;</button>
    </div>
    
    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 14px;">Title</label>
      <input id="vault-title" type="text" value="\${pageTitle}" style="width: 100%; padding: 8px 12px; background: #334155; border: 1px solid #475569; border-radius: 6px; color: white; font-size: 14px;" />
    </div>
    
    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 14px;">URL</label>
      <input id="vault-url" type="text" value="\${pageUrl}" readonly style="width: 100%; padding: 8px 12px; background: #1e293b; border: 1px solid #475569; border-radius: 6px; color: #94a3b8; font-size: 14px;" />
    </div>
    
    \${selectedText ? \`
    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 14px;">Selected Text</label>
      <textarea id="vault-excerpt" style="width: 100%; height: 80px; padding: 8px 12px; background: #334155; border: 1px solid #475569; border-radius: 6px; color: white; font-size: 14px; resize: vertical;">\${selectedText}</textarea>
    </div>
    \` : ''}
    
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 14px;">Tags (comma separated)</label>
      <input id="vault-tags" type="text" placeholder="web, article, research" style="width: 100%; padding: 8px 12px; background: #334155; border: 1px solid #475569; border-radius: 6px; color: white; font-size: 14px;" />
    </div>
    
    <div style="display: flex; gap: 12px;">
      <button id="vault-save" style="flex: 1; padding: 10px; background: #a855f7; border: none; border-radius: 6px; color: white; font-weight: 500; cursor: pointer; font-size: 14px;">Save to Vault</button>
      <button id="vault-cancel" style="padding: 10px 20px; background: #475569; border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 14px;">Cancel</button>
    </div>
    
    <div id="vault-status" style="margin-top: 12px; font-size: 14px; text-align: center;"></div>
  \`;

  overlay.appendChild(form);
  document.body.appendChild(overlay);

  // Event handlers
  document.getElementById('vault-close').onclick = () => overlay.remove();
  document.getElementById('vault-cancel').onclick = () => overlay.remove();
  
  document.getElementById('vault-save').onclick = async () => {
    const saveBtn = document.getElementById('vault-save');
    const status = document.getElementById('vault-status');
    
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    try {
      const title = document.getElementById('vault-title').value;
      const url = document.getElementById('vault-url').value;
      const excerpt = document.getElementById('vault-excerpt')?.value || metaDescription;
      const tags = document.getElementById('vault-tags').value.split(',').map(t => t.trim()).filter(Boolean);
      
      // Get page HTML for snapshot
      const htmlSnapshot = document.documentElement.outerHTML;
      
      const response = await fetch('${baseUrl}/api/items/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          url,
          html: htmlSnapshot,
          title,
          excerpt,
          tags,
          space_id: '00000000-0000-0000-0000-000000000001' // Default to common space
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        status.style.color = '#10b981';
        status.textContent = result.message || 'Saved successfully!';
        setTimeout(() => overlay.remove(), 2000);
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error) {
      status.style.color = '#ef4444';
      status.textContent = error.message || 'Failed to save. Please try again.';
      saveBtn.textContent = 'Save to Vault';
      saveBtn.disabled = false;
    }
  };
  
  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
})();
  `.trim()

  // Return minified bookmarklet
  const minified = bookmarkletCode.replace(/\s+/g, " ").replace(/;\s*}/g, "}")

  return NextResponse.json({
    bookmarklet: `javascript:${encodeURIComponent(minified)}`,
    code: bookmarkletCode,
  })
}
