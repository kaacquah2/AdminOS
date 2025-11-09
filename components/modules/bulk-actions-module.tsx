"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { CheckSquare, Square, Trash2, FileText, Send, Mail } from "lucide-react"
import { getEmployees, deleteEmployee } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { sendEmail } from "@/lib/database"

interface Employee {
  id: string
  name: string
  email: string
  department: string
  selected: boolean
}

export function BulkActionsModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmployees()
  }, [])

  async function loadEmployees() {
    try {
      setLoading(true)
      const data = await getEmployees()
      setEmployees(
        (data || []).map((emp: any) => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          department: emp.department,
          selected: false,
        }))
      )
    } catch (error) {
      console.error("Error loading employees:", error)
      toast({
        title: "Error",
        description: "Failed to load employees. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedCount = employees.filter((e) => e.selected).length
  const allSelected = employees.length > 0 && employees.every((e) => e.selected)

  const toggleSelect = (id: string) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e)))
  }

  const toggleSelectAll = () => {
    setEmployees((prev) => prev.map((e) => ({ ...e, selected: !allSelected })))
  }

  const deleteSelected = async () => {
    if (selectedCount === 0) return

    if (!confirm(`Delete ${selectedCount} selected employee${selectedCount !== 1 ? "s" : ""}?`)) {
      return
    }

    try {
      const selectedEmployees = employees.filter((e) => e.selected)
      for (const emp of selectedEmployees) {
        await deleteEmployee(emp.id)
      }
      await loadEmployees()
      toast({
        title: "Success",
        description: `Deleted ${selectedCount} employee${selectedCount !== 1 ? "s" : ""} successfully.`,
      })
    } catch (error) {
      console.error("Error deleting employees:", error)
      toast({
        title: "Error",
        description: "Failed to delete employees. Please try again.",
        variant: "destructive",
      })
    }
  }

  const exportSelected = () => {
    const selectedEmployees = employees.filter((e) => e.selected)
    if (selectedCount === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one employee to export.",
        variant: "destructive",
      })
      return
    }

    // Create CSV content
    const headers = ["Name", "Email", "Department"]
    const rows = selectedEmployees.map((emp) => [emp.name, emp.email, emp.department])
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `employees_export_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Success",
      description: `Exported ${selectedCount} employee${selectedCount !== 1 ? "s" : ""} as CSV.`,
    })
  }

  const sendEmailToSelected = async () => {
    const selectedEmployees = employees.filter((e) => e.selected)
    if (selectedCount === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one employee to send email to.",
        variant: "destructive",
      })
      return
    }

    try {
      // Send email to each selected employee
      for (const emp of selectedEmployees) {
        await sendEmail({
          to_email: emp.email,
          subject: "Bulk Notification",
          body: `Hello ${emp.name},\n\nThis is a bulk notification sent from AdminOS.\n\nBest regards,\n${user?.fullName || "Admin"}`,
          type: "notification",
        })
      }

      toast({
        title: "Success",
        description: `Email sent to ${selectedCount} employee${selectedCount !== 1 ? "s" : ""}.`,
      })
    } catch (error) {
      console.error("Error sending emails:", error)
      toast({
        title: "Error",
        description: "Failed to send emails. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Bulk Actions</h1>
        <p className="text-muted-foreground">Select multiple items and perform batch operations efficiently.</p>
      </div>

      {selectedCount > 0 && (
        <Card className="p-4 bg-primary/10 border-primary/20">
          <div className="flex justify-between items-center">
            <p className="font-semibold">
              {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2 bg-transparent" onClick={exportSelected}>
                <FileText className="w-4 h-4" />
                Export CSV
              </Button>
              <Button size="sm" variant="outline" className="gap-2 bg-transparent" onClick={sendEmailToSelected}>
                <Mail className="w-4 h-4" />
                Send Email
              </Button>
              <Button size="sm" variant="destructive" className="gap-2" onClick={deleteSelected}>
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4">
                  <button onClick={toggleSelectAll} className="hover:opacity-70 transition-opacity">
                    {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold">Name</th>
                <th className="text-left py-3 px-4 font-semibold">Email</th>
                <th className="text-left py-3 px-4 font-semibold">Department</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className={`border-b border-border hover:bg-secondary/50 transition-colors ${emp.selected ? "bg-primary/10" : ""}`}
                  >
                    <td className="py-4 px-4">
                      <button onClick={() => toggleSelect(emp.id)} className="hover:opacity-70 transition-opacity">
                        {emp.selected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-4 px-4 font-medium">{emp.name}</td>
                    <td className="py-4 px-4">{emp.email}</td>
                    <td className="py-4 px-4">{emp.department}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
