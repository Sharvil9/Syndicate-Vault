"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MoreHorizontal, Shield, User, Clock, CheckCircle, XCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface UserManagementProps {
  users: any[]
}

export default function UserManagement({ users }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const pendingUsers = filteredUsers.filter((user) => !user.approved_at && user.role !== "admin")
  const approvedUsers = filteredUsers.filter((user) => user.approved_at || user.role === "admin")
  const allUsers = filteredUsers

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to approve user:", error)
    }
  }

  const handleToggleRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === "admin" ? "member" : "admin"
      const response = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to update user role:", error)
    }
  }

  const UserTable = ({ userList }: { userList: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-700">
          <TableHead className="text-slate-300">User</TableHead>
          <TableHead className="text-slate-300">Role</TableHead>
          <TableHead className="text-slate-300">Status</TableHead>
          <TableHead className="text-slate-300">Invited By</TableHead>
          <TableHead className="text-slate-300">Joined</TableHead>
          <TableHead className="text-slate-300">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {userList.map((user) => (
          <TableRow key={user.id} className="border-slate-700">
            <TableCell>
              <div>
                <div className="font-medium text-white">{user.full_name || "No name"}</div>
                <div className="text-sm text-slate-400">{user.email}</div>
                {user.invite_code && <div className="text-xs text-slate-500 mt-1">Code: {user.invite_code}</div>}
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={
                  user.role === "admin" ? "bg-purple-600/20 text-purple-400" : "bg-slate-600/20 text-slate-400"
                }
              >
                {user.role === "admin" ? <Shield className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>
              {user.role === "admin" ? (
                <Badge className="bg-green-600/20 text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              ) : user.approved_at ? (
                <Badge className="bg-green-600/20 text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              ) : (
                <Badge className="bg-yellow-600/20 text-yellow-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-slate-300">
              {user.invited_by?.full_name || user.invited_by?.email || "Direct signup"}
            </TableCell>
            <TableCell className="text-slate-400">
              {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700">
                  {!user.approved_at && user.role !== "admin" && (
                    <DropdownMenuItem
                      className="text-green-400 hover:bg-slate-700"
                      onClick={() => handleApproveUser(user.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve User
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-slate-300 hover:bg-slate-700"
                    onClick={() => handleToggleRole(user.id, user.role)}
                  >
                    {user.role === "admin" ? (
                      <>
                        <User className="h-4 w-4 mr-2" />
                        Remove Admin
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Make Admin
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 hover:bg-slate-700">View Activity</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-400 hover:bg-slate-700">
                    <XCircle className="h-4 w-4 mr-2" />
                    Suspend User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
        {userList.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-slate-400 py-8">
              No users found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">User Management</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900/50">
            <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700">
              Pending ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-slate-700">
              Approved ({approvedUsers.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-700">
              All Users ({allUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <UserTable userList={pendingUsers} />
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <UserTable userList={approvedUsers} />
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <UserTable userList={allUsers} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
