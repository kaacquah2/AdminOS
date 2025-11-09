"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Send, Heart } from "lucide-react"

export function CommunicationModule() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      author: "Sarah Chen",
      role: "Engineering Lead",
      content: "Great work on the Q4 project! Let's schedule a debrief meeting.",
      timestamp: "2 hours ago",
      likes: 5,
      liked: false,
    },
    {
      id: 2,
      author: "Marcus Johnson",
      role: "Sales Manager",
      content: "New product features are live! Please share with your teams.",
      timestamp: "4 hours ago",
      likes: 12,
      liked: false,
    },
    {
      id: 3,
      author: "Emily Rodriguez",
      role: "Marketing Manager",
      content: "Marketing campaign reached 100k impressions today!",
      timestamp: "6 hours ago",
      likes: 18,
      liked: false,
    },
  ])

  const [announcements] = useState([
    { id: 1, title: "Office Closure", date: "Dec 25-26", priority: "high" },
    { id: 2, title: "New Year Virtual Team Building", date: "Jan 12", priority: "medium" },
    { id: 3, title: "Q1 Planning Session", date: "Jan 20", priority: "medium" },
  ])

  const [meetings] = useState([
    { id: 1, title: "Weekly Standup", time: "10:00 AM", organizer: "Sarah Chen", attendees: 8 },
    { id: 2, title: "Finance Review", time: "2:00 PM", organizer: "John Smith", attendees: 4 },
    { id: 3, title: "All Hands Meeting", time: "3:30 PM", organizer: "CEO", attendees: 342 },
  ])

  const [newMessage, setNewMessage] = useState("")
  const [activeTab, setActiveTab] = useState("messages")

  const handleLike = (id: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, liked: !m.liked, likes: m.liked ? m.likes - 1 : m.likes + 1 } : m)),
    )
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        {
          id: messages.length + 1,
          author: "You",
          role: "Admin",
          content: newMessage,
          timestamp: "now",
          likes: 0,
          liked: false,
        },
        ...messages,
      ])
      setNewMessage("")
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Communication Center</h1>
        <p className="text-muted-foreground">Internal messaging, announcements, and meeting management.</p>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 border-b border-border mb-6">
          {["messages", "announcements", "meetings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 text-sm font-medium transition-colors border-b-2 capitalize ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "messages" && (
          <div className="space-y-4">
            <div className="bg-secondary p-4 rounded-lg space-y-3">
              <textarea
                placeholder="Share a message or update with your team..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={3}
              />
              <Button onClick={handleSendMessage} className="gap-2">
                <Send className="w-4 h-4" />
                Post
              </Button>
            </div>

            <div className="space-y-3">
              {messages.map((msg) => (
                <Card key={msg.id} className="p-4">
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{msg.author}</p>
                      <p className="text-xs text-muted-foreground">{msg.role}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{msg.timestamp}</p>
                  </div>
                  <p className="text-sm mb-3">{msg.content}</p>
                  <button
                    onClick={() => handleLike(msg.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${msg.liked ? "fill-current text-primary" : ""}`} />
                    {msg.likes}
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "announcements" && (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-lg border-l-4 ${
                  ann.priority === "high" ? "bg-red-50 border-red-500" : "bg-blue-50 border-blue-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{ann.title}</p>
                    <p className="text-sm text-muted-foreground">{ann.date}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded font-semibold ${
                      ann.priority === "high" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {ann.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "meetings" && (
          <div className="space-y-3">
            {meetings.map((mtg) => (
              <div key={mtg.id} className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{mtg.title}</p>
                    <p className="text-sm text-muted-foreground">Organized by {mtg.organizer}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Join
                  </Button>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{mtg.time}</span>
                  <span>{mtg.attendees} attendees</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
