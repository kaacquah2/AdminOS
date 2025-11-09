"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { createMessage, getMessages, markMessageAsRead } from "@/lib/database"
import { dbToMessage, type Message } from "@/lib/type-adapters"
import { useToast } from "@/hooks/use-toast"
import { Mail, Send, Bell, Users } from "lucide-react"

export function MessagingModule() {
  const { user, getAllUsers } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedTab, setSelectedTab] = useState<"direct" | "department" | "broadcast">("direct")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [formData, setFormData] = useState({
    recipientId: "",
    subject: "",
    body: "",
  })

  useEffect(() => {
    loadMessages()
    loadUsers()
  }, [user])

  async function loadUsers() {
    try {
      const users = await getAllUsers()
      setAllUsers(users)
    } catch (error) {
      console.error('Error loading users:', error)
      setAllUsers([])
    }
  }

  async function loadMessages() {
    if (user) {
      try {
        const userMessages = await getMessages(user.id)
        // Convert database format (snake_case) to frontend format (camelCase)
        const convertedMessages = Array.isArray(userMessages) 
          ? userMessages.map(dbToMessage)
          : []
        setMessages(convertedMessages)
      } catch (error) {
        console.error('Error loading messages:', error)
        setMessages([]) // Ensure messages is always an array
      }
    } else {
      setMessages([]) // Ensure messages is always an array when no user
    }
  }

  async function handleSendMessage() {
    if (!user || !formData.subject || !formData.body) return

    try {
      const recipientName = selectedTab === "direct" 
        ? allUsers.find((u) => u.id === formData.recipientId)?.fullName 
        : undefined

      const dbMessage = await createMessage({
        sender_id: user.id,
        sender_name: user.fullName,
        recipient_id: selectedTab === "direct" ? formData.recipientId : undefined,
        recipient_name: recipientName,
        department_id: selectedTab === "department" ? user.department : undefined,
        subject: formData.subject,
        body: formData.body,
        type: selectedTab,
        status: "unread",
        attachments: [],
      })

      // Convert to frontend format and add to messages
      const message = dbToMessage(dbMessage)
      setMessages([message, ...messages]) // Add to beginning for newest first
      setFormData({ recipientId: "", subject: "", body: "" })
      setShowCompose(false)
      
      // Reload messages to get fresh data from database
      await loadMessages()
      toast({
        title: "Success",
        description: "Message sent successfully.",
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredMessages = messages.filter((msg) => {
    if (selectedTab === "direct") return msg.type === "direct"
    if (selectedTab === "department") return msg.type === "department"
    return msg.type === "broadcast"
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messaging & Communication</h1>
          <p className="text-muted-foreground">Send and receive messages across the organization</p>
        </div>
        <Button onClick={() => setShowCompose(!showCompose)} className="gap-2">
          <Mail size={20} />
          New Message
        </Button>
      </div>

      {showCompose && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTab === "direct" && (
              <div>
                <label className="text-sm font-medium">Recipient</label>
                <select
                  value={formData.recipientId}
                  onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Select recipient...</option>
                  {allUsers
                    .filter((u) => u.id !== user?.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.position})
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Message subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                placeholder="Type your message..."
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                rows={5}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSendMessage} className="flex-1 gap-2">
                <Send size={16} />
                Send
              </Button>
              <Button onClick={() => setShowCompose(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="direct" className="gap-2">
            <Mail size={16} />
            Direct
          </TabsTrigger>
          <TabsTrigger value="department" className="gap-2">
            <Users size={16} />
            Department
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-2">
            <Bell size={16} />
            Broadcast
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail size={48} className="text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No messages in this category</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {filteredMessages.map((msg) => (
                  <Card
                    key={msg.id}
                    className={`cursor-pointer hover:border-primary/50 transition ${
                      msg.status === "unread" ? "border-primary/50 bg-primary/5" : ""
                    }`}
                    onClick={async () => {
                      setSelectedMessage(msg)
                      try {
                        await markMessageAsRead(msg.id)
                        // Reload messages to update read status
                        await loadMessages()
                      } catch (error) {
                        console.error('Error marking message as read:', error)
                      }
                    }}
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{msg.senderName}</p>
                            {msg.status === "unread" && <Badge className="bg-blue-100 text-blue-800">New</Badge>}
                          </div>
                          <h3 className="font-medium mt-1">{msg.subject}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.body}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedMessage && (
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                    <CardDescription>From: {selectedMessage.senderName}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{selectedMessage.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedMessage.timestamp).toLocaleString()}
                    </p>
                    <Button className="w-full gap-2">
                      <Mail size={16} />
                      Reply
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
