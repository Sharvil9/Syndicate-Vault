"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, Download, Bookmark, Chrome, Globe } from "lucide-react"

export default function BookmarkletSetup() {
  const [bookmarkletCode, setBookmarkletCode] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Fetch bookmarklet code
    fetch("/api/bookmarklet")
      .then((res) => res.json())
      .then((data) => setBookmarkletCode(data.bookmarklet))
      .catch(console.error)
  }, [])

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadExtension = () => {
    // Create a simple extension zip file content
    const manifest = {
      manifest_version: 3,
      name: "Syndicate Vault Saver",
      version: "1.0",
      description: "Save content to your Syndicate Vault",
      permissions: ["activeTab", "storage"],
      action: {
        default_popup: "popup.html",
        default_title: "Save to Vault",
      },
      content_scripts: [
        {
          matches: ["<all_urls>"],
          js: ["content.js"],
        },
      ],
    }

    // This would typically generate actual extension files
    // For now, we'll just show instructions
    alert("Extension download coming soon! Use the bookmarklet for now.")
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="bookmarklet" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
          <TabsTrigger value="bookmarklet" className="data-[state=active]:bg-purple-600">
            <Bookmark className="h-4 w-4 mr-2" />
            Bookmarklet
          </TabsTrigger>
          <TabsTrigger value="extension" className="data-[state=active]:bg-purple-600">
            <Chrome className="h-4 w-4 mr-2" />
            Browser Extension
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookmarklet" className="space-y-6">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Bookmarklet Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">How to install:</h3>
                <ol className="text-slate-300 space-y-2 text-sm">
                  <li>1. Copy the bookmarklet code below</li>
                  <li>2. Create a new bookmark in your browser</li>
                  <li>3. Paste the code as the URL</li>
                  <li>4. Name it "Save to Vault"</li>
                  <li>5. Click the bookmark on any page to save content</li>
                </ol>
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium">Bookmarklet Code:</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-900/50 p-3 rounded border border-slate-600 font-mono text-xs text-slate-300 overflow-x-auto">
                    {bookmarkletCode || "Loading..."}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(bookmarkletCode)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-600/30 p-4 rounded-lg">
                <h4 className="text-blue-300 font-medium mb-2">Features:</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• Capture page title and URL automatically</li>
                  <li>• Save selected text as excerpt</li>
                  <li>• Add custom tags</li>
                  <li>• Full HTML snapshot for offline viewing</li>
                  <li>• Works on any website</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extension" className="space-y-6">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Chrome className="h-5 w-5" />
                Browser Extension
                <Badge variant="secondary" className="bg-orange-600/20 text-orange-400">
                  Coming Soon
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Planned Features:</h3>
                <ul className="text-slate-300 space-y-2 text-sm">
                  <li>• Right-click context menu to save content</li>
                  <li>• Keyboard shortcuts for quick capture</li>
                  <li>• Automatic tagging suggestions</li>
                  <li>• Bulk save multiple tabs</li>
                  <li>• Offline queue for saving when disconnected</li>
                </ul>
              </div>

              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">Browser extension is in development</p>
                <Button onClick={downloadExtension} disabled className="bg-slate-600 text-slate-400">
                  <Download className="h-4 w-4 mr-2" />
                  Download Extension (Soon)
                </Button>
              </div>

              <div className="bg-purple-900/20 border border-purple-600/30 p-4 rounded-lg">
                <h4 className="text-purple-300 font-medium mb-2">Development Files:</h4>
                <p className="text-purple-200 text-sm mb-3">For developers who want to build the extension locally:</p>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-900/50 p-2 rounded font-mono text-slate-300">
                    chrome-extension/
                    <br />
                    ├── manifest.json
                    <br />
                    ├── popup.html
                    <br />
                    ├── popup.js
                    <br />
                    └── content.js
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
