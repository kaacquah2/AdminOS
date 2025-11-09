"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { Plus, Image, FileText, Video, Download, RefreshCw, Search, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getBrandAssets,
  createBrandAsset,
  type BrandAsset
} from "@/lib/database"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function BrandAssetsModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [showNewAsset, setShowNewAsset] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [formData, setFormData] = useState({
    asset_name: "",
    asset_type: "",
    category: "",
    description: "",
    file_url: "",
    thumbnail_url: "",
    file_size: "",
    file_format: "",
    tags: "",
    usage_rights: "",
  })

  const isManager = user?.role === "dept_manager" || 
                    user?.role === "super_admin" ||
                    user?.department === "Marketing & Communications"

  useEffect(() => {
    loadAssets()
  }, [user])

  async function loadAssets() {
    if (!user) return
    try {
      setLoading(true)
      const data = await getBrandAssets()
      setAssets(data || [])
    } catch (error) {
      console.error("Error loading brand assets:", error)
      toast({
        title: "Error",
        description: "Failed to load brand assets.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAsset() {
    if (!user || !formData.asset_name || !formData.asset_type || !formData.file_url || !formData.usage_rights) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const tagsArray = formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(t => t) : []

      await createBrandAsset({
        asset_name: formData.asset_name,
        asset_type: formData.asset_type,
        category: formData.category || undefined,
        description: formData.description || undefined,
        file_url: formData.file_url,
        thumbnail_url: formData.thumbnail_url || undefined,
        file_size: formData.file_size ? parseInt(formData.file_size) : undefined,
        file_format: formData.file_format || undefined,
        tags: tagsArray,
        usage_rights: formData.usage_rights,
        created_by: user.id,
        created_by_name: user.fullName,
      })
      await loadAssets()
      setShowNewAsset(false)
      setFormData({
        asset_name: "",
        asset_type: "",
        category: "",
        description: "",
        file_url: "",
        thumbnail_url: "",
        file_size: "",
        file_format: "",
        tags: "",
        usage_rights: "",
      })
      toast({
        title: "Success",
        description: "Brand asset created successfully.",
      })
    } catch (error) {
      console.error("Error creating asset:", error)
      toast({
        title: "Error",
        description: "Failed to create asset.",
        variant: "destructive",
      })
    }
  }

  const getAssetIcon = (assetType: string) => {
    switch (assetType.toLowerCase()) {
      case "image":
        return <Image className="w-6 h-6" />
      case "video":
        return <Video className="w-6 h-6" />
      default:
        return <FileText className="w-6 h-6" />
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const filteredAssets = assets.filter((asset) => {
    if (searchQuery && !asset.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !asset.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterType !== "all" && asset.asset_type !== filterType) {
      return false
    }
    if (filterCategory !== "all" && asset.category !== filterCategory) {
      return false
    }
    return true
  })

  const activeAssets = assets.filter((a) => a.is_active).length
  const approvedAssets = assets.filter((a) => a.is_approved).length
  const totalDownloads = assets.reduce((sum, a) => sum + (a.download_count || 0), 0)
  const assetTypes = [...new Set(assets.map(a => a.asset_type))]
  const assetCategories = [...new Set(assets.map(a => a.category).filter(c => c))]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Brand Asset Management</h1>
          <p className="text-muted-foreground">Manage your brand assets and marketing materials</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowNewAsset(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Upload Asset
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">All assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssets}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedAssets}</div>
            <p className="text-xs text-muted-foreground">Brand compliant</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDownloads}</div>
            <p className="text-xs text-muted-foreground">Asset usage</p>
          </CardContent>
        </Card>
      </div>

      {/* New Asset Modal */}
      {showNewAsset && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Upload New Brand Asset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Asset Name *</Label>
                <Input
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  placeholder="Logo - Primary"
                />
              </div>
              <div>
                <Label>Asset Type *</Label>
                <Select value={formData.asset_type} onValueChange={(value) => setFormData({ ...formData, asset_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logo">Logo</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="font">Font</SelectItem>
                    <SelectItem value="color_palette">Color Palette</SelectItem>
                    <SelectItem value="icon">Icon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand_identity">Brand Identity</SelectItem>
                  <SelectItem value="marketing_materials">Marketing Materials</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="presentations">Presentations</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Asset description..."
                rows={3}
              />
            </div>
            <div>
              <Label>File URL *</Label>
              <Input
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Thumbnail URL</Label>
                <Input
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>File Format</Label>
                <Input
                  value={formData.file_format}
                  onChange={(e) => setFormData({ ...formData, file_format: e.target.value })}
                  placeholder="PNG, JPG, PDF, etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>File Size (bytes)</Label>
                <Input
                  type="number"
                  value={formData.file_size}
                  onChange={(e) => setFormData({ ...formData, file_size: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Usage Rights *</Label>
                <Select value={formData.usage_rights} onValueChange={(value) => setFormData({ ...formData, usage_rights: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rights" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal_only">Internal Only</SelectItem>
                    <SelectItem value="external_use">External Use</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="logo, brand, primary"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateAsset} className="flex-1">
                Upload Asset
              </Button>
              <Button onClick={() => setShowNewAsset(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {assetTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {assetCategories.map((cat) => (
                    <SelectItem key={cat || 'unknown'} value={cat || 'unknown'}>{cat || 'Unknown'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No assets found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => (
                <Card key={asset.id} className="hover:shadow-lg transition">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        {getAssetIcon(asset.asset_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{asset.asset_name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{asset.asset_type}</p>
                        {asset.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{asset.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {asset.category && (
                            <Badge variant="outline" className="text-xs">{asset.category}</Badge>
                          )}
                          {asset.is_approved && (
                            <Badge className="bg-green-100 text-green-800 text-xs flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Approved
                            </Badge>
                          )}
                          {asset.brand_guideline_compliant && (
                            <Badge variant="outline" className="text-xs">Compliant</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="text-xs text-muted-foreground">
                            {asset.file_format && <span>{asset.file_format}</span>}
                            {asset.file_size && <span className="ml-2">{formatFileSize(asset.file_size)}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              <Download className="w-3 h-3 inline mr-1" />
                              {asset.download_count || 0}
                            </span>
                            {asset.file_url && (
                              <a
                                href={asset.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                View
                              </a>
                            )}
                          </div>
                        </div>
                        {asset.tags && asset.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {asset.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">#{tag}</Badge>
                            ))}
                            {asset.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{asset.tags.length - 3}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

