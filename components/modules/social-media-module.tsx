"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { Plus, Share2, RefreshCw, Instagram, Facebook, Linkedin, Twitter, Youtube, Calendar } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getSocialMediaPosts,
  createSocialMediaPost,
  type SocialMediaPost
} from "@/lib/database"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function SocialMediaModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<SocialMediaPost[]>([])
  const [showNewPost, setShowNewPost] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [formData, setFormData] = useState({
    platform: "",
    account_name: "",
    post_type: "",
    content_text: "",
    scheduled_date: "",
    scheduled_time: "",
    hashtags: "",
    mentions: "",
    link_url: "",
  })

  const isManager = user?.role === "dept_manager" || 
                    user?.role === "super_admin" ||
                    user?.department === "Marketing & Communications"

  useEffect(() => {
    loadPosts()
  }, [user])

  async function loadPosts() {
    if (!user) return
    try {
      setLoading(true)
      const data = await getSocialMediaPosts()
      setPosts(data || [])
    } catch (error) {
      console.error("Error loading social media posts:", error)
      toast({
        title: "Error",
        description: "Failed to load social media posts.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreatePost() {
    if (!user || !formData.platform || !formData.account_name || !formData.content_text) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const hashtagsArray = formData.hashtags ? formData.hashtags.split(",").map(h => h.trim()).filter(h => h) : []
      const mentionsArray = formData.mentions ? formData.mentions.split(",").map(m => m.trim()).filter(m => m) : []

      await createSocialMediaPost({
        platform: formData.platform,
        account_name: formData.account_name,
        post_type: formData.post_type,
        content_text: formData.content_text,
        scheduled_date: formData.scheduled_date || undefined,
        scheduled_time: formData.scheduled_time || undefined,
        hashtags: hashtagsArray,
        mentions: mentionsArray,
        link_url: formData.link_url || undefined,
        created_by: user.id,
        created_by_name: user.fullName,
      })
      await loadPosts()
      setShowNewPost(false)
      setFormData({
        platform: "",
        account_name: "",
        post_type: "",
        content_text: "",
        scheduled_date: "",
        scheduled_time: "",
        hashtags: "",
        mentions: "",
        link_url: "",
      })
      toast({
        title: "Success",
        description: "Social media post created successfully.",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post.",
        variant: "destructive",
      })
    }
  }

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase()
    if (platformLower.includes("facebook")) return <Facebook className="w-4 h-4" />
    if (platformLower.includes("instagram")) return <Instagram className="w-4 h-4" />
    if (platformLower.includes("linkedin")) return <Linkedin className="w-4 h-4" />
    if (platformLower.includes("twitter") || platformLower.includes("x")) return <Twitter className="w-4 h-4" />
    if (platformLower.includes("youtube")) return <Youtube className="w-4 h-4" />
    return <Share2 className="w-4 h-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredPosts = posts.filter((p) => {
    if (activeTab === "all") return true
    if (activeTab === "platform") return true // Will filter by selected platform
    return p.status.toLowerCase() === activeTab.toLowerCase()
  })

  // Analytics data
  const platformStats = posts.reduce((acc: any, post: SocialMediaPost) => {
    const platform = post.platform
    if (!acc[platform]) {
      acc[platform] = { count: 0, engagement: 0 }
    }
    acc[platform].count++
    if (post.performance_metrics && typeof post.performance_metrics === 'object') {
      const metrics = post.performance_metrics as any
      acc[platform].engagement += (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0)
    }
    return acc
  }, {})

  const platformChartData = Object.entries(platformStats).map(([platform, stats]: [string, any]) => ({
    platform,
    posts: stats.count,
    engagement: stats.engagement,
  }))

  const publishedPosts = posts.filter((p) => p.status === "published").length
  const scheduledPosts = posts.filter((p) => p.status === "scheduled").length
  const totalEngagement = posts.reduce((sum, p) => {
    if (p.performance_metrics && typeof p.performance_metrics === 'object') {
      const metrics = p.performance_metrics as any
      return sum + (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0)
    }
    return sum
  }, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Social Media Management</h1>
          <p className="text-muted-foreground">Create, schedule, and track social media posts</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowNewPost(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
            <p className="text-xs text-muted-foreground">All platforms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedPosts}</div>
            <p className="text-xs text-muted-foreground">Live posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledPosts}</div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Likes, comments, shares</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance Chart */}
      {platformChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="posts" fill="#8884d8" name="Posts" />
                <Bar dataKey="engagement" fill="#82ca9d" name="Engagement" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* New Post Modal */}
      {showNewPost && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Create Social Media Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Platform *</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="pinterest">Pinterest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Account Name *</Label>
                <Input
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="e.g., @companyname"
                />
              </div>
            </div>
            <div>
              <Label>Post Type</Label>
              <Select value={formData.post_type} onValueChange={(value) => setFormData({ ...formData, post_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea
                value={formData.content_text}
                onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                placeholder="Write your post content..."
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Scheduled Time</Label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Hashtags (comma-separated)</Label>
              <Input
                value={formData.hashtags}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                placeholder="marketing, business, tips"
              />
            </div>
            <div>
              <Label>Mentions (comma-separated)</Label>
              <Input
                value={formData.mentions}
                onChange={(e) => setFormData({ ...formData, mentions: e.target.value })}
                placeholder="@user1, @user2"
              />
            </div>
            <div>
              <Label>Link URL</Label>
              <Input
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreatePost} className="flex-1">
                Create Post
              </Button>
              <Button onClick={() => setShowNewPost(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No posts found</p>
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <div key={post.id} className="p-4 border rounded-lg hover:bg-accent/50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              {getPlatformIcon(post.platform)}
                              <span className="font-medium">{post.account_name}</span>
                            </div>
                            <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                            <Badge variant="outline">{post.post_type}</Badge>
                          </div>
                          <p className="text-sm mb-3 whitespace-pre-wrap">{post.content_text}</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {post.hashtags && post.hashtags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">#{tag}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {post.published_date && (
                              <span>
                                <Calendar className="w-3 h-3 inline mr-1" />
                                Published: {new Date(post.published_date).toLocaleDateString()}
                              </span>
                            )}
                            {post.scheduled_date && !post.published_date && (
                              <span>
                                <Calendar className="w-3 h-3 inline mr-1" />
                                Scheduled: {new Date(post.scheduled_date).toLocaleDateString()}
                                {post.scheduled_time && ` at ${post.scheduled_time}`}
                              </span>
                            )}
                            {post.link_url && (
                              <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                View Link
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          {post.performance_metrics && typeof post.performance_metrics === 'object' && (
                            <div className="text-sm space-y-1">
                              {post.performance_metrics.likes && (
                                <p>❤️ {post.performance_metrics.likes}</p>
                              )}
                              {post.performance_metrics.comments && (
                                <p>💬 {post.performance_metrics.comments}</p>
                              )}
                              {post.performance_metrics.shares && (
                                <p>🔁 {post.performance_metrics.shares}</p>
                              )}
                              {post.engagement_rate && (
                                <p className="text-xs text-muted-foreground">
                                  {post.engagement_rate.toFixed(2)}% engagement
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

