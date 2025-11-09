"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Megaphone, 
  TrendingUp, 
  DollarSign,
  Users,
  Calendar,
  Image,
  Share2,
  Target,
  BarChart3,
  Eye,
  MousePointerClick,
  Zap,
  FileText,
  Video,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getMarketingCampaigns,
  getContentCalendar,
  getSocialMediaPosts,
  getMarketingEvents,
  getBrandAssets,
  getCampaignPerformance,
  type MarketingCampaign,
  type ContentCalendar,
  type SocialMediaPost,
  type MarketingEvent,
  type BrandAsset
} from "@/lib/database"

interface MarketingDashboardProps {
  onNavigate?: (module: string) => void
}

export function MarketingDashboard({ onNavigate }: MarketingDashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Data states
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [contentItems, setContentItems] = useState<ContentCalendar[]>([])
  const [socialPosts, setSocialPosts] = useState<SocialMediaPost[]>([])
  const [events, setEvents] = useState<MarketingEvent[]>([])
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([])

  // Metrics
  const [metrics, setMetrics] = useState({
    activeCampaigns: 0,
    totalBudget: 0,
    totalSpent: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    averageROI: 0,
    scheduledContent: 0,
    publishedPosts: 0,
    upcomingEvents: 0,
    totalAssets: 0,
  })

  const isManager = user?.role === "dept_manager" || 
                    user?.role === "super_admin" ||
                    user?.department === "Marketing & Communications"

  useEffect(() => {
    loadMarketingData()
  }, [user])

  async function loadMarketingData() {
    if (!user) return

    try {
      setLoading(true)

      // Load all marketing data
      const [campaignsData, contentData, postsData, eventsData, assetsData] = await Promise.all([
        getMarketingCampaigns(),
        getContentCalendar(),
        getSocialMediaPosts(),
        getMarketingEvents(),
        getBrandAssets({ is_active: true })
      ])

      setCampaigns(campaignsData || [])
      setContentItems(contentData || [])
      setSocialPosts(postsData || [])
      setEvents(eventsData || [])
      setBrandAssets(assetsData || [])

      // Calculate metrics
      const activeCampaigns = (campaignsData || []).filter(
        (c: MarketingCampaign) => c.status === "active" || c.status === "planning"
      ).length

      const totalBudget = (campaignsData || []).reduce(
        (sum: number, c: MarketingCampaign) => sum + parseFloat(String(c.budget_allocated || 0)), 0
      )
      const totalSpent = (campaignsData || []).reduce(
        (sum: number, c: MarketingCampaign) => sum + parseFloat(String(c.budget_spent || 0)), 0
      )

      const totalImpressions = (campaignsData || []).reduce(
        (sum: number, c: MarketingCampaign) => sum + (c.impressions || 0), 0
      )
      const totalClicks = (campaignsData || []).reduce(
        (sum: number, c: MarketingCampaign) => sum + (c.clicks || 0), 0
      )
      const totalConversions = (campaignsData || []).reduce(
        (sum: number, c: MarketingCampaign) => sum + (c.conversions || 0), 0
      )

      const campaignsWithROI = (campaignsData || []).filter(
        (c: MarketingCampaign) => c.actual_roi !== null && c.actual_roi !== undefined
      )
      const averageROI = campaignsWithROI.length > 0
        ? campaignsWithROI.reduce((sum: number, c: MarketingCampaign) => sum + (c.actual_roi || 0), 0) / campaignsWithROI.length
        : 0

      const scheduledContent = (contentData || []).filter(
        (c: ContentCalendar) => c.status === "scheduled"
      ).length

      const publishedPosts = (postsData || []).filter(
        (p: SocialMediaPost) => p.status === "published"
      ).length

      const now = new Date()
      const upcomingEvents = (eventsData || []).filter(
        (e: MarketingEvent) => new Date(e.start_date) >= now && e.status !== "cancelled"
      ).length

      setMetrics({
        activeCampaigns,
        totalBudget,
        totalSpent,
        totalImpressions,
        totalClicks,
        totalConversions,
        averageROI,
        scheduledContent,
        publishedPosts,
        upcomingEvents,
        totalAssets: assetsData?.length || 0,
      })
    } catch (error) {
      console.error("Error loading marketing data:", error)
      toast({
        title: "Error",
        description: "Failed to load marketing data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
      case "active":
      case "published":
      case "completed":
        return "bg-green-100 text-green-800"
      case "planning":
      case "draft":
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "paused":
      case "archived":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Chart data
  const campaignTypeData = campaigns.reduce((acc: any, campaign: MarketingCampaign) => {
    const type = campaign.campaign_type || "Other"
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  const campaignTypeChartData = Object.entries(campaignTypeData).map(([name, value]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value
  }))

  const statusColors = ["#6366f1", "#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa"]

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketing & Communications Dashboard</h1>
          <p className="text-muted-foreground">Campaign performance, content calendar, and marketing analytics</p>
        </div>
        <Button onClick={loadMarketingData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.filter((c: MarketingCampaign) => c.status === "active").length} running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((metrics.totalSpent / (metrics.totalBudget || 1)) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${(metrics.totalSpent / 1000).toFixed(1)}K / ${(metrics.totalBudget / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.totalImpressions / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalClicks} clicks ({metrics.totalClicks > 0 ? ((metrics.totalClicks / metrics.totalImpressions) * 100).toFixed(2) : 0}% CTR)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageROI > 0 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4" />
                  {metrics.averageROI.toFixed(1)}%
                </span>
              ) : (
                <span className="text-muted-foreground">--</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalConversions} conversions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="content">Content Calendar</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="assets">Brand Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Campaign Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Campaigns by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={campaignTypeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {campaignTypeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.slice(0, 5).map((campaign: MarketingCampaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{campaign.campaign_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {campaign.campaign_type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${(campaign.budget_spent / 1000).toFixed(1)}K
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.impressions > 0 ? `${(campaign.impressions / 1000).toFixed(1)}K` : "0"} impressions
                        </p>
                      </div>
                    </div>
                  ))}
                  {campaigns.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No campaigns yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.scheduledContent}</div>
                <p className="text-xs text-muted-foreground">Upcoming posts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Published Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.publishedPosts}</div>
                <p className="text-xs text-muted-foreground">Social media</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.upcomingEvents}</div>
                <p className="text-xs text-muted-foreground">Scheduled events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Brand Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalAssets}</div>
                <p className="text-xs text-muted-foreground">Available assets</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Marketing Campaigns</CardTitle>
                {isManager && (
                  <Button size="sm" className="gap-2" onClick={() => onNavigate?.("campaigns")}>
                    <Plus className="w-4 h-4" />
                    New Campaign
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.map((campaign: MarketingCampaign) => (
                  <div key={campaign.id} className="p-4 border rounded-lg hover:bg-accent/50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{campaign.campaign_name}</h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="text-muted-foreground">
                            <Target className="w-4 h-4 inline mr-1" />
                            {campaign.objective}
                          </span>
                          <span className="text-muted-foreground">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {new Date(campaign.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            Budget: ${(campaign.budget_spent / 1000).toFixed(1)}K / ${(campaign.budget_allocated / 1000).toFixed(1)}K
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Impressions: {(campaign.impressions / 1000).toFixed(1)}K
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Clicks: {campaign.clicks} | Conversions: {campaign.conversions}
                          </p>
                          {campaign.actual_roi && (
                            <p className={`text-xs font-medium ${campaign.actual_roi > 0 ? "text-green-600" : "text-red-600"}`}>
                              ROI: {campaign.actual_roi > 0 ? "+" : ""}{campaign.actual_roi.toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No campaigns found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Content Calendar</CardTitle>
                {isManager && (
                  <Button size="sm" className="gap-2" onClick={() => onNavigate?.("contentCalendar")}>
                    <Plus className="w-4 h-4" />
                    Schedule Content
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contentItems.slice(0, 10).map((content: ContentCalendar) => (
                  <div key={content.id} className="p-4 border rounded-lg hover:bg-accent/50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{content.title}</h3>
                          <Badge className={getStatusColor(content.status)}>
                            {content.status}
                          </Badge>
                          <Badge variant="outline">{content.content_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{content.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(content.scheduled_date).toLocaleDateString()}
                            {content.scheduled_time && ` at ${content.scheduled_time}`}
                          </span>
                          {content.assigned_to_name && (
                            <span>
                              <Users className="w-3 h-3 inline mr-1" />
                              {content.assigned_to_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <Badge variant="outline" className={content.priority === "high" ? "border-red-500" : ""}>
                          {content.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {contentItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No content scheduled</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Social Media Posts</CardTitle>
                {isManager && (
                  <Button size="sm" className="gap-2" onClick={() => onNavigate?.("socialMedia")}>
                    <Plus className="w-4 h-4" />
                    New Post
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {socialPosts.slice(0, 10).map((post: SocialMediaPost) => (
                  <div key={post.id} className="p-4 border rounded-lg hover:bg-accent/50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {getPlatformIcon(post.platform)}
                            <span className="font-medium">{post.account_name}</span>
                          </div>
                          <Badge className={getStatusColor(post.status)}>
                            {post.status}
                          </Badge>
                          <Badge variant="outline">{post.post_type}</Badge>
                        </div>
                        <p className="text-sm mt-2 line-clamp-2">{post.content_text}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {post.published_date && (
                            <span>
                              Published: {new Date(post.published_date).toLocaleDateString()}
                            </span>
                          )}
                          {post.scheduled_date && !post.published_date && (
                            <span>
                              Scheduled: {new Date(post.scheduled_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        {post.performance_metrics && typeof post.performance_metrics === 'object' && (
                          <div className="text-xs space-y-1">
                            {post.performance_metrics.likes && (
                              <p>❤️ {post.performance_metrics.likes}</p>
                            )}
                            {post.performance_metrics.comments && (
                              <p>💬 {post.performance_metrics.comments}</p>
                            )}
                            {post.performance_metrics.shares && (
                              <p>🔁 {post.performance_metrics.shares}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {socialPosts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No social media posts</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Marketing Events</CardTitle>
                {isManager && (
                  <Button size="sm" className="gap-2" onClick={() => onNavigate?.("marketingEvents")}>
                    <Plus className="w-4 h-4" />
                    New Event
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.map((event: MarketingEvent) => (
                  <div key={event.id} className="p-4 border rounded-lg hover:bg-accent/50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{event.event_name}</h3>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                          <Badge variant="outline">{event.event_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(event.start_date).toLocaleDateString()}
                            {event.start_time && ` at ${event.start_time}`}
                          </span>
                          {event.location && (
                            <span>
                              📍 {event.location}
                            </span>
                          )}
                          {event.registration_required && (
                            <span>
                              👥 {event.registered_attendees} / {event.max_attendees || "∞"} registered
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium">
                          Budget: ${(event.budget_spent / 1000).toFixed(1)}K / ${(event.budget_allocated / 1000).toFixed(1)}K
                        </p>
                        {event.leads_generated > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.leads_generated} leads generated
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No events scheduled</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Brand Assets</CardTitle>
                {isManager && (
                  <Button size="sm" className="gap-2" onClick={() => onNavigate?.("brandAssets")}>
                    <Plus className="w-4 h-4" />
                    Upload Asset
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brandAssets.map((asset: BrandAsset) => (
                  <div key={asset.id} className="p-4 border rounded-lg hover:bg-accent/50 transition">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        {asset.asset_type === "image" ? (
                          <Image className="w-6 h-6" />
                        ) : asset.asset_type === "video" ? (
                          <Video className="w-6 h-6" />
                        ) : (
                          <FileText className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{asset.asset_name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{asset.asset_type}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {asset.category || "Uncategorized"}
                          </Badge>
                          {asset.is_approved && (
                            <Badge className="bg-green-100 text-green-800 text-xs">Approved</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Downloads: {asset.download_count}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {brandAssets.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8 col-span-full">No brand assets</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

