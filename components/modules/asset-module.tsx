"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Plus, Package, AlertCircle, TrendingUp, Clock } from "lucide-react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { AddAssetModal } from "@/components/modals/add-asset-modal"
import { getAssets, createAsset, getInventoryItems, getProcurementOrders, getAssetMaintenance } from "@/lib/database"

export function AssetModule() {
  const [assets, setAssets] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [procurementOrders, setProcurementOrders] = useState<any[]>([])
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddAssetModal, setShowAddAssetModal] = useState(false)

  const colors = ["#6366f1", "#60a5fa", "#f87171", "#34d399"]

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [assetsData, inventoryData, ordersData, maintenanceData] = await Promise.all([
        getAssets(),
        getInventoryItems(),
        getProcurementOrders(),
        getAssetMaintenance(),
      ])

      setAssets(assetsData || [])
      setInventory(inventoryData || [])
      setProcurementOrders(ordersData || [])
      
      // Transform maintenance data and join with assets
      const maintenanceWithAssets = (maintenanceData || []).map((m: any) => {
        const asset = (assetsData || []).find((a: any) => a.id === m.asset_id)
        return {
          asset: asset?.name || "Unknown Asset",
          nextMaintenance: m.scheduled_date,
          type: m.maintenance_type,
        }
      })
      setMaintenanceSchedule(maintenanceWithAssets)
    } catch (error) {
      console.error("Error loading asset data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate asset condition breakdown
  const assetCondition = assets.reduce((acc: any[], asset: any) => {
    const existing = acc.find((a) => a.name === asset.condition)
    if (existing) {
      existing.value++
    } else {
      acc.push({ name: asset.condition, value: 1 })
    }
    return acc
  }, [])

  // Calculate asset category breakdown
  const assetCategory = assets.reduce((acc: any[], asset: any) => {
    const existing = acc.find((a) => a.name === asset.category)
    if (existing) {
      existing.value++
    } else {
      acc.push({ name: asset.category, value: 1 })
    }
    return acc
  }, [])

  // Calculate stats
  const totalAssetValue = assets.reduce((sum, asset) => sum + parseFloat(asset.value || 0), 0)
  const assetsInUse = assets.filter((a) => a.status === "In Use" || a.status === "Assigned").length
  const lowStockItems = inventory.filter((item) => item.stock <= item.reorder_level).length

  const handleAddAsset = async (data: any) => {
    try {
      await createAsset({
        name: data.name,
        category: data.category,
        assignee_name: data.assignee === "Unassigned" ? null : data.assignee,
        status: data.assignee === "Unassigned" ? "Available" : "In Use",
        value: Number.parseFloat(data.value),
        purchase_date: new Date().toISOString().split("T")[0],
        condition: data.condition,
      })
      await loadData() // Reload data
    } catch (error) {
      console.error("Error creating asset:", error)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Assets & Procurement</h1>
          <p className="text-muted-foreground">Manage company assets, inventory, and purchases.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddAssetModal(true)}>
          <Plus className="w-4 h-4" />
          Add Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Asset Value</p>
          <p className="text-3xl font-bold">
            ${loading ? "..." : (totalAssetValue / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-blue-600 mt-2">across {assets.length} items</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Assets in Use</p>
          <p className="text-3xl font-bold">{loading ? "..." : assetsInUse}</p>
          <p className="text-xs text-green-600 mt-2">Assigned to employees</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Low Stock Items</p>
          <p className="text-3xl font-bold">{loading ? "..." : lowStockItems}</p>
          <p className="text-xs text-yellow-600 mt-2">Needs reordering</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Asset Condition Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={assetCondition}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {assetCondition.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Assets by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assetCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Asset Inventory</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Asset Name</th>
                <th className="text-left py-3 px-4 font-semibold">Category</th>
                <th className="text-left py-3 px-4 font-semibold">Assigned To</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Condition</th>
                <th className="text-left py-3 px-4 font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-4 px-4 text-center text-muted-foreground">
                    Loading assets...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 px-4 text-center text-muted-foreground">
                    No assets found
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="py-4 px-4 font-medium">{asset.name}</td>
                    <td className="py-4 px-4">{asset.category}</td>
                    <td className="py-4 px-4">{asset.assignee_name || "Unassigned"}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        asset.status === "In Use" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`text-xs font-medium ${
                        asset.condition === "Excellent"
                          ? "text-green-600"
                          : asset.condition === "Good"
                            ? "text-blue-600"
                            : asset.condition === "Fair"
                              ? "text-yellow-600"
                              : "text-red-600"
                      }`}
                    >
                      {asset.condition}
                    </span>
                  </td>
                    <td className="py-4 px-4 font-semibold">${parseFloat(asset.value || 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Maintenance Schedule
        </h3>
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading maintenance schedule...</p>
          ) : maintenanceSchedule.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scheduled maintenance</p>
          ) : (
            maintenanceSchedule.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border"
              >
                <div>
                  <p className="font-medium text-sm">{item.asset}</p>
                  <p className="text-xs text-muted-foreground">{item.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-primary">
                    {new Date(item.nextMaintenance).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Next scheduled</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Recent Procurement Orders
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Order ID</th>
                <th className="text-left py-3 px-4 font-semibold">Vendor</th>
                <th className="text-left py-3 px-4 font-semibold">Items</th>
                <th className="text-left py-3 px-4 font-semibold">Order Value</th>
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-4 px-4 text-center text-muted-foreground">
                    Loading procurement orders...
                  </td>
                </tr>
              ) : procurementOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 px-4 text-center text-muted-foreground">
                    No procurement orders found
                  </td>
                </tr>
              ) : (
                procurementOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="py-4 px-4 font-medium">{order.order_number}</td>
                    <td className="py-4 px-4">{order.vendor}</td>
                    <td className="py-4 px-4">{order.items_count} items</td>
                    <td className="py-4 px-4 font-semibold">${parseFloat(order.value || 0).toLocaleString()}</td>
                    <td className="py-4 px-4">{new Date(order.order_date).toLocaleDateString()}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "Delivered"
                          ? "bg-green-100 text-green-800"
                          : order.status === "In Transit"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Consumables & Inventory
        </h3>
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading inventory...</p>
          ) : inventory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inventory items found</p>
          ) : (
            inventory.map((item, idx) => {
              const status = item.stock <= item.reorder_level ? "Low Stock" : "Stocked"
              return (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Reorder Level: {item.reorder_level}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{item.stock} {item.unit || "units"}</p>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium mt-1 ${
                        status === "Stocked" ? "text-green-600" : "text-yellow-600"
                      }`}
                    >
                      {status === "Low Stock" && <AlertCircle className="w-3 h-3" />}
                      {status}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <AddAssetModal isOpen={showAddAssetModal} onClose={() => setShowAddAssetModal(false)} onSubmit={handleAddAsset} />
    </div>
  )
}
