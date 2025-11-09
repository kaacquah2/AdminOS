"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getEmailLog } from "@/lib/database"
import { Mail, Search } from "lucide-react"

export function EmailLogsModule() {
  const [emails, setEmails] = useState<any[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadEmails()
  }, [])

  function loadEmails() {
    const emailLog = getEmailLog()
    setEmails(emailLog)
  }

  const filteredEmails = emails.filter(
    (email) =>
      email.to.toLowerCase().includes(search.toLowerCase()) ||
      email.subject.toLowerCase().includes(search.toLowerCase()),
  )

  const statusColors: Record<string, string> = {
    sent: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  }

  const typeColors: Record<string, string> = {
    task_assignment: "bg-blue-100 text-blue-800",
    approval: "bg-purple-100 text-purple-800",
    notification: "bg-cyan-100 text-cyan-800",
    reminder: "bg-orange-100 text-orange-800",
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Email Logs</h1>
        <p className="text-muted-foreground">View all sent emails and notifications</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredEmails.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No emails found</p>
            </CardContent>
          </Card>
        ) : (
          filteredEmails.map((email) => (
            <Card key={email.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold">{email.to}</p>
                      <Badge className={statusColors[email.status]}>{email.status}</Badge>
                      <Badge className={typeColors[email.type]}>{email.type}</Badge>
                    </div>
                    <h3 className="font-medium mb-2">{email.subject}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{email.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(email.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
