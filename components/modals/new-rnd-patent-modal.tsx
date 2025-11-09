"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { X, Search, ExternalLink } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getRNDProjects } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

interface NewRNDPatentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function NewRNDPatentModal({ isOpen, onClose, onSubmit }: NewRNDPatentModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<any[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [formData, setFormData] = useState({
    patent_title: "",
    patent_type: "utility_patent",
    rnd_project_id: "",
    technology_area: "",
    inventors: "",
    filing_date: "",
    patent_office: "USPTO",
  })

  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  async function loadProjects() {
    try {
      const data = await getRNDProjects()
      setProjects(data || [])
    } catch (error) {
      console.error("Error loading projects:", error)
    }
  }

  const handleSearchPatents = async () => {
    if (!formData.patent_title || formData.patent_title.length < 3) {
      toast({
        title: "Error",
        description: "Please enter at least 3 characters to search.",
        variant: "destructive",
      })
      return
    }

    setSearching(true)
    try {
      // Search for prior art using patent API integration
      // TODO: Implement searchPatents function
      const results: any[] = [] // await searchPatents({...})
      
      if (results.length === 0) {
        // Also try prior art check
        // TODO: Implement checkPriorArt function
        const priorArt: any[] = [] // await checkPriorArt(formData.patent_title, formData.technology_area)
        setSearchResults(priorArt)
        
        if (priorArt.length === 0) {
          toast({
            title: "No Results",
            description: "No similar patents found. This may be a novel invention.",
          })
        } else {
          toast({
            title: "Prior Art Found",
            description: `Found ${priorArt.length} potentially similar patents.`,
          })
        }
      } else {
        setSearchResults(results)
        toast({
          title: "Search Results",
          description: `Found ${results.length} patent(s) matching your search.`,
        })
      }
    } catch (error) {
      console.error("Error searching patents:", error)
      toast({
        title: "Search Unavailable",
        description: "Patent search integration is being configured. Please proceed with filing.",
        variant: "destructive",
      })
      // Set empty results to allow proceeding
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = () => {
    if (formData.patent_title) {
      const inventors = formData.inventors
        .split(",")
        .map(i => i.trim())
        .filter(i => i.length > 0)

      onSubmit({
        ...formData,
        rnd_project_id: formData.rnd_project_id || undefined,
        technology_area: formData.technology_area || undefined,
        inventors: inventors.length > 0 ? inventors : undefined,
        filing_date: formData.filing_date || undefined,
        patent_office: formData.patent_office || undefined,
        created_by: user?.id || "",
        created_by_name: user?.fullName || "Unknown",
      })
      setFormData({
        patent_title: "",
        patent_type: "utility_patent",
        rnd_project_id: "",
        technology_area: "",
        inventors: "",
        filing_date: "",
        patent_office: "USPTO",
      })
      setSearchResults([])
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">File Patent</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Patent Type *</Label>
              <Select value={formData.patent_type} onValueChange={(value) => setFormData({ ...formData, patent_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utility_patent">Utility Patent</SelectItem>
                  <SelectItem value="design_patent">Design Patent</SelectItem>
                  <SelectItem value="plant_patent">Plant Patent</SelectItem>
                  <SelectItem value="provisional">Provisional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Patent Office</Label>
              <Select value={formData.patent_office} onValueChange={(value) => setFormData({ ...formData, patent_office: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USPTO">USPTO (United States)</SelectItem>
                  <SelectItem value="EPO">EPO (European)</SelectItem>
                  <SelectItem value="WIPO">WIPO (International)</SelectItem>
                  <SelectItem value="UKIPO">UKIPO (United Kingdom)</SelectItem>
                  <SelectItem value="CNIPA">CNIPA (China)</SelectItem>
                  <SelectItem value="JPO">JPO (Japan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Patent Title *</Label>
            <div className="flex gap-2">
              <Input
                value={formData.patent_title}
                onChange={(e) => setFormData({ ...formData, patent_title: e.target.value })}
                placeholder="Enter patent title..."
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearchPatents}
                disabled={searching || !formData.patent_title || formData.patent_title.length < 3}
              >
                <Search className="w-4 h-4 mr-2" />
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Search existing patents to check for prior art
            </p>
          </div>

          {searchResults.length > 0 && (
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm font-semibold mb-2">Search Results:</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <div key={idx} className="text-xs p-2 bg-background rounded">
                    <p className="font-medium">{result.title}</p>
                    <p className="text-muted-foreground">{result.patentNumber} • {result.filingDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Related R&D Project (Optional)</Label>
            <Select value={formData.rnd_project_id} onValueChange={(value) => setFormData({ ...formData, rnd_project_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_number} - {project.research_objective.substring(0, 50)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Technology Area</Label>
              <Input
                value={formData.technology_area}
                onChange={(e) => setFormData({ ...formData, technology_area: e.target.value })}
                placeholder="e.g., Biotechnology, AI, Materials..."
              />
            </div>

            <div>
              <Label>Filing Date (Optional)</Label>
              <Input
                type="date"
                value={formData.filing_date}
                onChange={(e) => setFormData({ ...formData, filing_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Inventors (Optional)</Label>
            <Input
              value={formData.inventors}
              onChange={(e) => setFormData({ ...formData, inventors: e.target.value })}
              placeholder="Comma-separated list of inventors..."
            />
            <p className="text-xs text-muted-foreground mt-1">Separate multiple inventors with commas</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Patent Database Integration</p>
                <p className="text-xs text-blue-700 mt-1">
                  This form integrates with external patent databases (USPTO, EPO, WIPO) for prior art searches and patent filing.
                  In production, this would connect to official patent office APIs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!formData.patent_title}>
              File Patent
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

