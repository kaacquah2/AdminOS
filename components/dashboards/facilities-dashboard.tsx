"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Hammer, Clock, MapPin, TrendingDown, Wrench, Building2, Lightbulb, FolderKanban } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export function FacilitiesDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [facilitiesStats, setFacilitiesStats] = useState({
    maintenanceRequests: 0,
    completedThisMonth: 0,
    buildingOccupancy: 0,
    energyConsumption: 0,
  })
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([])
  const [facilityAssets, setFacilityAssets] = useState<any[]>([])
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<any[]>([])
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([])
  const [facilityProjects, setFacilityProjects] = useState<any[]>([])

  useEffect(() => {
    loadFacilitiesData()
  }, [user])

  async function loadFacilitiesData() {
    try {
      setLoading(true)

      // Get facility assets
      const { data: assets } = await supabase
        .from("assets")
        .select("*")
        .in("category", ["Facilities", "Maintenance", "Building", "Equipment"])
        .order("created_at", { ascending: false })

      // Get maintenance schedules
      const { data: maintenance } = await supabase
        .from("asset_maintenance")
        .select("*")
        .order("scheduled_date", { ascending: true })

      // Get workflow tasks for maintenance requests
      const { data: tasks } = await supabase
        .from("workflow_tasks")
        .select("*")
        .eq("department", "Facilities & Maintenance")
        .order("created_at", { ascending: false })

      // Get facility projects
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("department", "Facilities & Maintenance")
        .order("created_at", { ascending: false })

      // Calculate stats
      const thisMonth = new Date()
      thisMonth.setDate(1)
      const completedThisMonth = maintenance?.filter(
        (m: any) => m.completed_date && new Date(m.completed_date) >= thisMonth
      ).length || 0

      const pendingRequests = tasks?.filter((t: any) => t.status === "pending" || t.status === "in_progress").length || 0

      // Building occupancy (simulated - would come from access logs)
      const occupancy = Math.floor(Math.random() * 15) + 75 // 75-90%

      // Energy consumption (simulated)
      const energy = Math.floor(Math.random() * 2000) + 7500 // $7,500-$9,500

      // Upcoming maintenance (next 30 days)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      const upcoming = maintenance?.filter((m: any) => {
        if (!m.scheduled_date || m.completed_date) return false
        const scheduled = new Date(m.scheduled_date)
        return scheduled <= thirtyDaysFromNow && scheduled >= new Date()
      }).slice(0, 5) || []

      // Maintenance history (last 10 completed)
      const history = maintenance?.filter((m: any) => m.completed_date).slice(0, 10) || []

      setFacilitiesStats({
        maintenanceRequests: pendingRequests,
        completedThisMonth,
        buildingOccupancy: occupancy,
        energyConsumption: energy,
      })
      setMaintenanceTasks(tasks?.slice(0, 10) || [])
      setFacilityAssets(assets?.slice(0, 8) || [])
      setUpcomingMaintenance(upcoming)
      setMaintenanceHistory(history)
      setFacilityProjects(projects || [])
    } catch (error) {
      console.error("Error loading facilities data:", error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      label: "Maintenance Requests",
      value: facilitiesStats.maintenanceRequests.toString(),
      icon: Hammer,
      color: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
    {
      label: "Completed This Month",
      value: facilitiesStats.completedThisMonth.toString(),
      icon: Clock,
      color: "from-accent/10 to-accent/5",
      iconColor: "text-green-600",
    },
    {
      label: "Building Occupancy",
      value: `${facilitiesStats.buildingOccupancy}%`,
      icon: MapPin,
      color: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-600",
    },
    {
      label: "Energy Consumption",
      value: `$${facilitiesStats.energyConsumption.toLocaleString()}`,
      icon: Zap,
      color: "from-yellow-500/10 to-yellow-500/5",
      iconColor: "text-yellow-600",
    },
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facilities Management Dashboard</h1>
          <p className="text-muted-foreground mt-2">Maintenance, asset management, and facility operations</p>
        </div>
        <Button onClick={loadFacilitiesData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className={`p-6 bg-gradient-to-br ${stat.color} hover:shadow-lg transition-shadow`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-10 h-10 ${stat.iconColor}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Active Maintenance Tasks */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-foreground">Active Maintenance Tasks</h3>
          {maintenanceTasks.length > 0 && (
            <Badge variant="secondary">{maintenanceTasks.length} active</Badge>
          )}
        </div>
        {maintenanceTasks.length > 0 ? (
          <div className="space-y-3">
            {maintenanceTasks.map((task: any) => (
              <div key={task.id} className="p-3 bg-muted rounded flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      task.priority === "critical"
                        ? "destructive"
                        : task.priority === "high"
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                  <Badge
                    variant={
                      task.status === "completed"
                        ? "default"
                        : task.status === "in_progress"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {task.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Hammer className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No active maintenance tasks</p>
          </div>
        )}
      </Card>

      {/* Upcoming Maintenance */}
      {upcomingMaintenance.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">Upcoming Scheduled Maintenance</h3>
            <Badge variant="outline">{upcomingMaintenance.length} scheduled</Badge>
          </div>
          <div className="space-y-3">
            {upcomingMaintenance.map((maint: any) => {
              const scheduled = new Date(maint.scheduled_date)
              const daysUntil = Math.ceil((scheduled.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              
              return (
                <div key={maint.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{maint.maintenance_type}</p>
                      <p className="text-xs text-muted-foreground">
                        Asset ID: {maint.asset_id?.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={daysUntil <= 7 ? "destructive" : "secondary"} className="text-xs">
                        {daysUntil} days
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Scheduled: {scheduled.toLocaleDateString()}</span>
                    {maint.cost && <span>Est. Cost: ${parseFloat(maint.cost).toLocaleString()}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Facility Assets */}
      {facilityAssets.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">Facility Assets</h3>
            <Badge variant="outline">{facilityAssets.length} assets</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {facilityAssets.map((asset: any) => (
              <div key={asset.id} className="p-3 bg-muted rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.category}</p>
                  </div>
                  <Badge
                    variant={
                      asset.status === "Available"
                        ? "default"
                        : asset.status === "Assigned"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {asset.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  {asset.location && (
                    <>
                      <MapPin className="w-3 h-3" />
                      <span>{asset.location}</span>
                    </>
                  )}
                </div>
                {asset.condition && (
                  <p className="text-xs text-muted-foreground mt-1">Condition: {asset.condition}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Facility Projects */}
      {facilityProjects.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">Facility Projects</h3>
            <Badge variant="outline">{facilityProjects.length} projects</Badge>
          </div>
          <div className="space-y-3">
            {facilityProjects.map((project: any) => (
              <div key={project.id} className="p-4 bg-muted rounded">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FolderKanban className="w-4 h-4 text-muted-foreground" />
                      <p className="font-semibold text-foreground">{project.name}</p>
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <Badge
                    variant={
                      project.status === "Completed"
                        ? "default"
                        : project.status === "In Progress"
                        ? "secondary"
                        : project.status === "On Hold"
                        ? "outline"
                        : "secondary"
                    }
                    className="text-xs ml-2"
                  >
                    {project.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-background rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{project.progress || 0}%</span>
                    </div>
                  </div>
                  {project.due_date && (
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-xs font-medium mt-1">
                        {new Date(project.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {project.budget && (
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="text-xs font-medium mt-1">
                        ${parseFloat(project.budget).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {project.owner_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Owner</p>
                      <p className="text-xs font-medium mt-1">{project.owner_name}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Energy Consumption Chart Placeholder */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Monthly Energy Consumption</h3>
        <div className="flex items-center justify-center py-12 bg-muted rounded">
          <div className="text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Energy tracking: ${facilitiesStats.energyConsumption.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {facilitiesStats.buildingOccupancy}% occupancy • Efficient usage
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
