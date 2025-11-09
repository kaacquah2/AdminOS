"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, TrendingUp, AlertCircle, DollarSign, FileText, Clock, CheckCircle, Users, ShoppingCart, FileCheck, BarChart3, Warehouse, Building2, Calendar, Star } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export function ProcurementDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [procurementStats, setProcurementStats] = useState({
    pendingPOs: 0,
    totalPOValue: 0,
    activeVendors: 0,
    overduePOs: 0,
    inventoryAlerts: 0,
    contractExpirations: 0,
    pendingRequests: 0,
    avgCycleTime: 0,
  })
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [procurementRequests, setProcurementRequests] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [vendorContracts, setVendorContracts] = useState<any[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [procurementTrends, setProcurementTrends] = useState<any[]>([])
  const [vendorPerformance, setVendorPerformance] = useState<any[]>([])
  const [spendByCategory, setSpendByCategory] = useState<any[]>([])
  const [recentPOs, setRecentPOs] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [expiringContracts, setExpiringContracts] = useState<any[]>([])

  useEffect(() => {
    loadProcurementData()
  }, [user])

  async function loadProcurementData() {
    try {
      setLoading(true)

      // Get procurement orders
      const { data: pos } = await supabase
        .from("procurement_orders")
        .select("*")
        .order("created_at", { ascending: false })

      // Get vendors
      const { data: vendorsData } = await supabase
        .from("vendors")
        .select("*")
        .eq("status", "Active")
        .order("name", { ascending: true })

      // Get procurement requests
      const { data: requests } = await supabase
        .from("procurement_requests")
        .select("*")
        .order("created_at", { ascending: false })

      // Get vendor contracts
      const { data: contracts } = await supabase
        .from("vendor_contracts")
        .select("*")
        .order("end_date", { ascending: true })

      // Get inventory items
      const { data: inventory } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("status", "Active")
        .order("name", { ascending: true })

      // Get vendor performance
      const { data: performance } = await supabase
        .from("vendor_performance")
        .select("*")
        .order("performance_date", { ascending: false })
        .limit(50)

      // Calculate stats
      const pending = pos?.filter((po: any) => po.status === "Pending" || po.status === "Submitted").length || 0
      const totalValue = pos?.reduce((sum: number, po: any) => sum + parseFloat(po.value || 0), 0) || 0
      const overdue = pos?.filter((po: any) => {
        if (!po.delivery_date || po.status === "Delivered" || po.status === "Received") return false
        return new Date(po.delivery_date) < new Date() && po.status !== "Delivered"
      }).length || 0

      const activeVendors = vendorsData?.length || 0
      const lowStockCount = inventory?.filter((item: any) => item.stock <= item.reorder_level).length || 0
      const expiringContracts = contracts?.filter((c: any) => {
        const endDate = new Date(c.end_date)
        const daysUntilExpiry = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0 && c.status === "Active"
      }).length || 0
      const pendingRequests = requests?.filter((r: any) => r.status === "pending" || r.status === "in_review").length || 0

      // Calculate average cycle time (from request to delivery)
      const deliveredPOs = pos?.filter((po: any) => po.status === "Delivered" || po.status === "Received") || []
      let totalCycleTime = 0
      let cycleTimeCount = 0
      deliveredPOs.forEach((po: any) => {
        if (po.order_date && po.received_date) {
          const orderDate = new Date(po.order_date)
          const receivedDate = new Date(po.received_date)
          const days = Math.ceil((receivedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
          totalCycleTime += days
          cycleTimeCount++
        }
      })
      const avgCycleTime = cycleTimeCount > 0 ? Math.round(totalCycleTime / cycleTimeCount) : 0

      // Generate procurement trends (last 6 months)
      const months = []
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthName = monthNames[date.getMonth()]
        const monthPOs = pos?.filter((po: any) => {
          const poDate = new Date(po.order_date || po.created_at)
          return poDate.getMonth() === date.getMonth() && poDate.getFullYear() === date.getFullYear()
        }) || []
        const monthValue = monthPOs.reduce((sum: number, po: any) => sum + parseFloat(po.value || 0), 0)
        months.push({
          month: monthName,
          orders: monthPOs.length,
          value: Math.round(monthValue),
        })
      }

      // Vendor performance (top 5 by spend)
      const vendorSpend: Record<string, { spend: number; orders: number; rating: number }> = {}
      pos?.forEach((po: any) => {
        const vendorName = po.vendor || "Unknown"
        if (!vendorSpend[vendorName]) {
          vendorSpend[vendorName] = { spend: 0, orders: 0, rating: 0 }
        }
        vendorSpend[vendorName].spend += parseFloat(po.value || 0)
        vendorSpend[vendorName].orders += 1
      })

      // Get vendor ratings
      vendorsData?.forEach((v: any) => {
        if (vendorSpend[v.name]) {
          vendorSpend[v.name].rating = parseFloat(v.rating || 0)
        }
      })

      const vendorData = Object.entries(vendorSpend)
        .sort(([, a], [, b]) => b.spend - a.spend)
        .slice(0, 5)
        .map(([name, data]) => ({
          name: name.length > 20 ? name.substring(0, 20) + "..." : name,
          spend: Math.round(data.spend),
          orders: data.orders,
          rating: data.rating,
        }))

      // Spend by category
      const categorySpend: Record<string, number> = {}
      pos?.forEach((po: any) => {
        const category = po.category || "other"
        categorySpend[category] = (categorySpend[category] || 0) + parseFloat(po.value || 0)
      })

      const categoryData = Object.entries(categorySpend)
        .map(([name, value]) => ({
          name: name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          value: Math.round(value),
        }))
        .sort((a, b) => b.value - a.value)

      // Low stock items (already defined above as lowStockCount, reuse the filtered array)
      const lowStockItemsArray = inventory?.filter((item: any) => item.stock <= item.reorder_level) || []

      // Expiring contracts
      const expiring = contracts?.filter((c: any) => {
        const endDate = new Date(c.end_date)
        const daysUntilExpiry = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0 && c.status === "Active"
      }) || []

      setProcurementStats({
        pendingPOs: pending,
        totalPOValue: totalValue,
        activeVendors: activeVendors,
        overduePOs: overdue,
        inventoryAlerts: lowStockItemsArray.length,
        contractExpirations: expiringContracts,
        pendingRequests: pendingRequests,
        avgCycleTime: avgCycleTime,
      })
      setPurchaseOrders(pos || [])
      setProcurementRequests(requests || [])
      setVendors(vendorsData || [])
      setVendorContracts(contracts || [])
      setInventoryItems(inventory || [])
      setRecentPOs(pos?.slice(0, 10) || [])
      setLowStockItems(lowStockItemsArray)
      setExpiringContracts(expiring)
      setProcurementTrends(months)
      setVendorPerformance(vendorData)
      setSpendByCategory(categoryData)
    } catch (error) {
      console.error("Error loading procurement data:", error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      label: "Pending POs",
      value: procurementStats.pendingPOs.toString(),
      icon: Package,
      color: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
      alert: procurementStats.pendingPOs > 10,
    },
    {
      label: "Total PO Value",
      value: `$${(procurementStats.totalPOValue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: "from-accent/10 to-accent/5",
      iconColor: "text-green-600",
    },
    {
      label: "Active Vendors",
      value: procurementStats.activeVendors.toString(),
      icon: Users,
      color: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-600",
    },
    {
      label: "Overdue POs",
      value: procurementStats.overduePOs.toString(),
      icon: AlertCircle,
      color: "from-red-500/10 to-red-500/5",
      iconColor: "text-red-600",
      alert: procurementStats.overduePOs > 0,
    },
    {
      label: "Inventory Alerts",
      value: procurementStats.inventoryAlerts.toString(),
      icon: Warehouse,
      color: "from-yellow-500/10 to-yellow-500/5",
      iconColor: "text-yellow-600",
      alert: procurementStats.inventoryAlerts > 0,
    },
    {
      label: "Contract Expirations",
      value: procurementStats.contractExpirations.toString(),
      icon: FileCheck,
      color: "from-orange-500/10 to-orange-500/5",
      iconColor: "text-orange-600",
      alert: procurementStats.contractExpirations > 0,
    },
    {
      label: "Pending Requests",
      value: procurementStats.pendingRequests.toString(),
      icon: ShoppingCart,
      color: "from-purple-500/10 to-purple-500/5",
      iconColor: "text-purple-600",
      alert: procurementStats.pendingRequests > 5,
    },
    {
      label: "Avg Cycle Time",
      value: `${procurementStats.avgCycleTime} days`,
      icon: Clock,
      color: "from-cyan-500/10 to-cyan-500/5",
      iconColor: "text-cyan-600",
    },
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
          <h1 className="text-3xl font-bold text-foreground">Procurement Dashboard</h1>
          <p className="text-muted-foreground mt-2">Purchase orders, vendor management, inventory, contracts, and procurement analytics</p>
        </div>
        <Button onClick={loadProcurementData} variant="outline" size="sm">
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
                {stat.alert && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Action needed
                  </p>
                )}
              </div>
              <stat.icon className={`w-10 h-10 ${stat.iconColor}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Procurement Trends (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={procurementTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Legend />
              <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
              <Bar dataKey="value" fill="#10b981" name="Value ($)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Spend by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={spendByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {spendByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Vendor Performance */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Star className="w-5 h-5" />
          Top Vendors by Spend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={vendorPerformance} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" />
            <YAxis dataKey="name" type="category" width={150} stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
            <Legend />
            <Bar dataKey="spend" fill="#8b5cf6" name="Spend ($)" />
            <Bar dataKey="orders" fill="#ec4899" name="Orders" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Orders */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">Recent Purchase Orders</h3>
            {recentPOs.filter((po: any) => po.status === "Pending" || po.status === "Submitted").length > 0 && (
              <Badge variant="destructive">
                {recentPOs.filter((po: any) => po.status === "Pending" || po.status === "Submitted").length} pending
              </Badge>
            )}
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentPOs.length > 0 ? (
              recentPOs.map((po: any) => {
                const isOverdue = po.delivery_date && new Date(po.delivery_date) < new Date() && po.status !== "Delivered" && po.status !== "Received"
                return (
                  <div
                    key={po.id}
                    className={`p-4 rounded border ${
                      isOverdue ? "border-red-500/50 bg-red-500/5" : "border-border bg-muted"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{po.order_number || `PO-${po.id.substring(0, 8)}`}</p>
                        <p className="text-sm text-muted-foreground">{po.vendor}</p>
                        {po.project_name && (
                          <p className="text-xs text-muted-foreground mt-1">Project: {po.project_name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">${parseFloat(po.value || 0).toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          )}
                          <Badge
                            variant={
                              po.status === "Delivered" || po.status === "Received"
                                ? "default"
                                : po.status === "Pending" || po.status === "Submitted"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {po.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Items: {po.items_count || 0}</span>
                      {po.order_date && (
                        <span>Ordered: {new Date(po.order_date).toLocaleDateString()}</span>
                      )}
                      {po.delivery_date && (
                        <span>Delivery: {new Date(po.delivery_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No purchase orders found</p>
              </div>
            )}
          </div>
        </Card>

        {/* Procurement Requests */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">Procurement Requests</h3>
            {procurementRequests.filter((r: any) => r.status === "pending" || r.status === "in_review").length > 0 && (
              <Badge variant="secondary">
                {procurementRequests.filter((r: any) => r.status === "pending" || r.status === "in_review").length} pending
              </Badge>
            )}
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {procurementRequests.length > 0 ? (
              procurementRequests.slice(0, 10).map((req: any) => (
                <div key={req.id} className="p-4 rounded border border-border bg-muted">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{req.title}</p>
                      <p className="text-sm text-muted-foreground">{req.department}</p>
                      {req.project_name && (
                        <p className="text-xs text-muted-foreground mt-1">Project: {req.project_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {req.estimated_cost && (
                        <p className="text-sm font-bold text-foreground">${parseFloat(req.estimated_cost || 0).toLocaleString()}</p>
                      )}
                      <Badge
                        variant={
                          req.status === "approved" ? "default" :
                          req.status === "pending" || req.status === "in_review" ? "secondary" :
                          req.status === "rejected" ? "destructive" : "outline"
                        }
                        className="text-xs mt-2"
                      >
                        {req.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>Priority: {req.priority}</span>
                    {req.required_by_date && (
                      <span>Required: {new Date(req.required_by_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No procurement requests found</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Two Column Layout - Inventory & Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Warehouse className="w-5 h-5" />
              Low Stock Alerts
            </h3>
            {lowStockItems.length > 0 && (
              <Badge variant="destructive">{lowStockItems.length} items</Badge>
            )}
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item: any) => {
                const stockPercent = (item.stock / item.reorder_level) * 100
                return (
                  <div key={item.id} className="p-4 rounded border border-yellow-500/50 bg-yellow-500/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{item.stock} {item.unit || "units"}</p>
                        <p className="text-xs text-muted-foreground">Reorder: {item.reorder_level}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Stock Level</span>
                        <span>{Math.round(stockPercent)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${Math.min(stockPercent, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All items are well stocked</p>
              </div>
            )}
          </div>
        </Card>

        {/* Expiring Contracts */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Expiring Contracts
            </h3>
            {expiringContracts.length > 0 && (
              <Badge variant="destructive">{expiringContracts.length} contracts</Badge>
            )}
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {expiringContracts.length > 0 ? (
              expiringContracts.map((contract: any) => {
                const endDate = new Date(contract.end_date)
                const daysUntilExpiry = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={contract.id} className="p-4 rounded border border-orange-500/50 bg-orange-500/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{contract.title}</p>
                        <p className="text-sm text-muted-foreground">{contract.vendor_name}</p>
                      </div>
                      <div className="text-right">
                        {contract.total_value && (
                          <p className="text-sm font-bold text-foreground">${parseFloat(contract.total_value || 0).toLocaleString()}</p>
                        )}
                        <Badge variant={daysUntilExpiry <= 30 ? "destructive" : "secondary"} className="text-xs mt-2">
                          {daysUntilExpiry} days
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Expires: {endDate.toLocaleDateString()}</span>
                      {contract.auto_renew && (
                        <Badge variant="outline" className="text-xs">Auto-renew</Badge>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No contracts expiring soon</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Active Vendors */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Active Vendors ({vendors.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.slice(0, 9).map((vendor: any) => (
            <div key={vendor.id} className="p-4 rounded border border-border bg-muted">
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-foreground">{vendor.name}</p>
                {vendor.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{vendor.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{vendor.category?.replace("_", " ")}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Orders: {vendor.total_orders || 0}</span>
                <span>Spend: ${((vendor.total_spend || 0) / 1000).toFixed(0)}K</span>
              </div>
              {vendor.on_time_delivery_rate > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>On-time Delivery</span>
                    <span>{vendor.on_time_delivery_rate.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${vendor.on_time_delivery_rate}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {vendors.length > 9 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Vendors ({vendors.length})
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
