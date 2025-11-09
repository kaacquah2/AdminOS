"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { 
  Plus, 
  Megaphone, 
  TrendingUp, 
  DollarSign,
  Eye,
  MousePointerClick,
  Zap,
  Target,
  Calendar,
  RefreshCw,
  Edit,
  BarChart3
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getMarketingCampaigns,
  createMarketingCampaign,
  updateMarketingCampaign,
  getCampaignPerformance,
  recordCampaignPerformance,
  type MarketingCampaign
} from "@/lib/database"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function CampaignsModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null)
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [showPerformanceModal, setShowPerformanceModal] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [formData, setFormData] = useState({
    campaign_name: "",
    campaign_type: "",
    description: "",
    objective: "",
    target_audience: "",
    start_date: "",
    end_date: "",
    budget_allocated: "",
    expected_roi: "",
    channels: [] as string[],
    tags: [] as string[],
  })
  const [performanceForm, setPerformanceForm] = useState({
    snapshot_date: "",
    impressions: "",
    clicks: "",
    conversions: "",
    engagement: "",
    revenue: "",
    spend: "",
    notes: "",
  })

  const isManager = user?.role === "dept_manager" || 
                    user?.role === "super_admin" ||
                    user?.department === "Marketing & Communications"

  useEffect(() => {
    loadCampaigns()
  }, [user])

  useEffect(() => {
    if (selectedCampaign) {
      loadPerformanceData(selectedCampaign.id)
    }
  }, [selectedCampaign])

  async function loadCampaigns() {
    if (!user) return
    try {
      setLoading(true)
      const data = await getMarketingCampaigns()
      setCampaigns(data || [])
    } catch (error) {
      console.error("Error loading campaigns:", error)
      toast({
        title: "Error",
        description: "Failed to load campaigns.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadPerformanceData(campaignId: string) {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const data = await getCampaignPerformance(
        campaignId,
        thirtyDaysAgo.toISOString().split("T")[0]
      )
      setPerformanceData(data || [])
    } catch (error) {
      console.error("Error loading performance data:", error)
    }
  }

  async function handleCreateCampaign() {
    if (!user || !formData.campaign_name || !formData.campaign_type || !formData.start_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      await createMarketingCampaign({
        campaign_name: formData.campaign_name,
        campaign_type: formData.campaign_type,
        description: formData.description,
        objective: formData.objective,
        target_audience: formData.target_audience,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        budget_allocated: formData.budget_allocated ? parseFloat(formData.budget_allocated) : undefined,
        expected_roi: formData.expected_roi ? parseFloat(formData.expected_roi) : undefined,
        campaign_manager_id: user.id,
        campaign_manager_name: user.fullName,
        created_by: user.id,
        created_by_name: user.fullName,
        channels: formData.channels,
        tags: formData.tags,
      })
      await loadCampaigns()
      setShowNewCampaign(false)
      setFormData({
        campaign_name: "",
        campaign_type: "",
        description: "",
        objective: "",
        target_audience: "",
        start_date: "",
        end_date: "",
        budget_allocated: "",
        expected_roi: "",
        channels: [],
        tags: [],
      })
      toast({
        title: "Success",
        description: "Campaign created successfully.",
      })
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast({
        title: "Error",
        description: "Failed to create campaign.",
        variant: "destructive",
      })
    }
  }

  async function handleRecordPerformance() {
    if (!selectedCampaign || !performanceForm.snapshot_date) {
      toast({
        title: "Error",
        description: "Please select a campaign and date.",
        variant: "destructive",
      })
      return
    }

    try {
      await recordCampaignPerformance({
        campaign_id: selectedCampaign.id,
        snapshot_date: performanceForm.snapshot_date,
        impressions: performanceForm.impressions ? parseInt(performanceForm.impressions) : undefined,
        clicks: performanceForm.clicks ? parseInt(performanceForm.clicks) : undefined,
        conversions: performanceForm.conversions ? parseInt(performanceForm.conversions) : undefined,
        engagement: performanceForm.engagement ? parseInt(performanceForm.engagement) : undefined,
        revenue: performanceForm.revenue ? parseFloat(performanceForm.revenue) : undefined,
        spend: performanceForm.spend ? parseFloat(performanceForm.spend) : undefined,
        notes: performanceForm.notes || undefined,
      })
      await loadPerformanceData(selectedCampaign.id)
      setShowPerformanceModal(false)
      setPerformanceForm({
        snapshot_date: "",
        impressions: "",
        clicks: "",
        conversions: "",
        engagement: "",
        revenue: "",
        spend: "",
        notes: "",
      })
      toast({
        title: "Success",
        description: "Performance data recorded successfully.",
      })
    } catch (error) {
      console.error("Error recording performance:", error)
      toast({
        title: "Error",
        description: "Failed to record performance data.",
        variant: "destructive",
      })
    }
  }

  async function handleUpdateStatus(campaignId: string, newStatus: string) {
    try {
      await updateMarketingCampaign(campaignId, { status: newStatus })
      await loadCampaigns()
      toast({
        title: "Success",
        description: "Campaign status updated.",
      })
    } catch (error) {
      console.error("Error updating campaign:", error)
      toast({
        title: "Error",
        description: "Failed to update campaign status.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "planning":
        return "bg-blue-100 text-blue-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === "all") return true
    return c.status.toLowerCase() === activeTab.toLowerCase()
  })

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget_allocated || 0), 0)
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.budget_spent || 0), 0)
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0)
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaign Management</h1>
          <p className="text-muted-foreground">Create, track, and analyze marketing campaigns</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowNewCampaign(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalBudget / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">${(totalSpent / 1000).toFixed(1)}K spent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalImpressions / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <p className="text-xs text-muted-foreground">Conversions achieved</p>
          </CardContent>
        </Card>
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Campaign Name *</Label>
                <Input
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  placeholder="Summer Sale 2024"
                />
              </div>
              <div>
                <Label>Campaign Type *</Label>
                <Select value={formData.campaign_type} onValueChange={(value) => setFormData({ ...formData, campaign_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="print">Print</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="pr">PR</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="influencer">Influencer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Campaign description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Objective</Label>
                <Select value={formData.objective} onValueChange={(value) => setFormData({ ...formData, objective: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select objective" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                    <SelectItem value="lead_generation">Lead Generation</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Audience</Label>
                <Input
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  placeholder="e.g., Millennials, B2B, etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget Allocated</Label>
                <Input
                  type="number"
                  value={formData.budget_allocated}
                  onChange={(e) => setFormData({ ...formData, budget_allocated: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Expected ROI (%)</Label>
                <Input
                  type="number"
                  value={formData.expected_roi}
                  onChange={(e) => setFormData({ ...formData, expected_roi: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateCampaign} className="flex-1">
                Create Campaign
              </Button>
              <Button onClick={() => setShowNewCampaign(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Campaigns</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No campaigns found</p>
              ) : (
                <div className="space-y-4">
                  {filteredCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className={`p-4 border rounded-lg hover:bg-accent/50 transition cursor-pointer ${
                        selectedCampaign?.id === campaign.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{campaign.campaign_name}</h3>
                            <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                            <Badge variant="outline">{campaign.campaign_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{campaign.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Budget</p>
                              <p className="font-medium">
                                ${(campaign.budget_spent / 1000).toFixed(1)}K / ${(campaign.budget_allocated / 1000).toFixed(1)}K
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Impressions</p>
                              <p className="font-medium">{(campaign.impressions / 1000).toFixed(1)}K</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Clicks</p>
                              <p className="font-medium">{campaign.clicks}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Conversions</p>
                              <p className="font-medium">{campaign.conversions}</p>
                            </div>
                          </div>
                          {campaign.actual_roi !== null && campaign.actual_roi !== undefined && (
                            <div className="mt-2">
                              <Badge className={campaign.actual_roi > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                ROI: {campaign.actual_roi > 0 ? "+" : ""}{campaign.actual_roi.toFixed(1)}%
                              </Badge>
                            </div>
                          )}
                        </div>
                        {isManager && (
                          <div className="ml-4 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCampaign(campaign)
                                setShowPerformanceModal(true)
                              }}
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                            <Select
                              value={campaign.status}
                              onValueChange={(value) => {
                                handleUpdateStatus(campaign.id, value)
                              }}
                            >
                              <SelectTrigger className="w-32" onClick={(e) => e.stopPropagation()}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planning">Planning</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Tracking */}
          {selectedCampaign && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Performance Tracking - {selectedCampaign.campaign_name}</CardTitle>
                  {isManager && (
                    <Button onClick={() => setShowPerformanceModal(true)} size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Record Performance
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {performanceData.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="snapshot_date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="impressions" stackId="1" stroke="#8884d8" fill="#8884d8" />
                        <Area type="monotone" dataKey="clicks" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                        <Area type="monotone" dataKey="conversions" stackId="3" stroke="#ffc658" fill="#ffc658" />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Impressions</p>
                        <p className="text-lg font-semibold">
                          {performanceData.reduce((sum, d) => sum + (d.impressions || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Clicks</p>
                        <p className="text-lg font-semibold">
                          {performanceData.reduce((sum, d) => sum + (d.clicks || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Conversions</p>
                        <p className="text-lg font-semibold">
                          {performanceData.reduce((sum, d) => sum + (d.conversions || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-lg font-semibold">
                          ${performanceData.reduce((sum, d) => sum + (d.revenue || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No performance data recorded yet</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Record Performance Modal */}
          {showPerformanceModal && selectedCampaign && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle>Record Performance Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={performanceForm.snapshot_date}
                      onChange={(e) => setPerformanceForm({ ...performanceForm, snapshot_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Spend</Label>
                    <Input
                      type="number"
                      value={performanceForm.spend}
                      onChange={(e) => setPerformanceForm({ ...performanceForm, spend: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Impressions</Label>
                    <Input
                      type="number"
                      value={performanceForm.impressions}
                      onChange={(e) => setPerformanceForm({ ...performanceForm, impressions: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Clicks</Label>
                    <Input
                      type="number"
                      value={performanceForm.clicks}
                      onChange={(e) => setPerformanceForm({ ...performanceForm, clicks: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Conversions</Label>
                    <Input
                      type="number"
                      value={performanceForm.conversions}
                      onChange={(e) => setPerformanceForm({ ...performanceForm, conversions: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Engagement</Label>
                    <Input
                      type="number"
                      value={performanceForm.engagement}
                      onChange={(e) => setPerformanceForm({ ...performanceForm, engagement: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Revenue</Label>
                    <Input
                      type="number"
                      value={performanceForm.revenue}
                      onChange={(e) => setPerformanceForm({ ...performanceForm, revenue: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={performanceForm.notes}
                    onChange={(e) => setPerformanceForm({ ...performanceForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRecordPerformance} className="flex-1">
                    Record Performance
                  </Button>
                  <Button onClick={() => setShowPerformanceModal(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

