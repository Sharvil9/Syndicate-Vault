"use client"

import { useActionState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Copy, Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { generateInviteCode } from "@/lib/actions/auth"
import { useState } from "react"

interface InviteManagementProps {
  invites: any[]
}

export default function InviteManagement({ invites }: InviteManagementProps) {
  const [state, formAction] = useActionState(generateInviteCode, null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getStatusBadge = (invite: any) => {
    if (invite.used_by) {
      return <Badge className="bg-green-600/20 text-green-400">Used</Badge>
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return <Badge className="bg-red-600/20 text-red-400">Expired</Badge>
    }
    if (invite.current_uses >= invite.max_uses) {
      return <Badge className="bg-orange-600/20 text-orange-400">Full</Badge>
    }
    return <Badge className="bg-blue-600/20 text-blue-400">Active</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Generate New Invite */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Generate New Invite</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
                {state.error}
              </div>
            )}

            {state?.success && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded text-sm">
                {state.success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUses" className="text-slate-300">
                  Maximum Uses
                </Label>
                <Input
                  id="maxUses"
                  name="maxUses"
                  type="number"
                  defaultValue="1"
                  min="1"
                  max="100"
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresIn" className="text-slate-300">
                  Expires In (days)
                </Label>
                <Input
                  id="expiresIn"
                  name="expiresIn"
                  type="number"
                  defaultValue="7"
                  min="1"
                  max="365"
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
            </div>

            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Generate Invite Code
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Invites */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Invite Codes ({invites.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Code</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Usage</TableHead>
                <TableHead className="text-slate-300">Created</TableHead>
                <TableHead className="text-slate-300">Expires</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id} className="border-slate-700">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-slate-900/50 px-2 py-1 rounded text-sm text-white">{invite.code}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(invite.code)}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedCode === invite.code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(invite)}</TableCell>
                  <TableCell className="text-slate-300">
                    {invite.current_uses} / {invite.max_uses}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {invite.expires_at
                      ? formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-white"
                      disabled={invite.used_by || invite.current_uses >= invite.max_uses}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
