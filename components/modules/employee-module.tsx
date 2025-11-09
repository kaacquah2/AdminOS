"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Search, Plus, Edit2, Trash2 } from "lucide-react"
import { AddEmployeeModal } from "@/components/modals/add-employee-modal"
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

interface Employee {
  id: string
  name: string
  email: string
  department: string
  role: string
  status: string
  join_date: string
}

export function EmployeeModule() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("All Departments")

  useEffect(() => {
    loadEmployees()
  }, [])

  async function loadEmployees() {
    try {
      setLoading(true)
      const data = await getEmployees()
      setEmployees(data || [])
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

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) {
      return
    }

    try {
      await deleteEmployee(id)
      await loadEmployees()
      toast({
        title: "Success",
        description: "Employee deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting employee:", error)
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowAddEmployeeModal(true)
  }

  const handleAddNewEmployee = async (data: any) => {
    try {
      if (editingEmployee) {
        // Update existing employee
        await updateEmployee(editingEmployee.id, {
          name: data.name,
          email: data.email,
          department: data.department,
          role: data.role,
        })
        toast({
          title: "Success",
          description: "Employee updated successfully.",
        })
      } else {
        // Create new employee
        await createEmployee({
          name: data.name,
          email: data.email,
          department: data.department,
          role: data.role,
          status: "Active",
          join_date: new Date().toISOString().split("T")[0],
        })
        toast({
          title: "Success",
          description: "Employee added successfully.",
        })
      }
      await loadEmployees()
      setShowAddEmployeeModal(false)
      setEditingEmployee(null)
    } catch (error) {
      console.error("Error saving employee:", error)
      toast({
        title: "Error",
        description: editingEmployee ? "Failed to update employee." : "Failed to add employee.",
        variant: "destructive",
      })
    }
  }

  const handleCloseModal = () => {
    setShowAddEmployeeModal(false)
    setEditingEmployee(null)
  }

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = departmentFilter === "All Departments" || emp.department === departmentFilter
    return matchesSearch && matchesDepartment
  })

  // Calculate stats
  const totalEmployees = employees.length
  const newHiresThisMonth = employees.filter((emp) => {
    const joinDate = new Date(emp.join_date)
    const now = new Date()
    return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear()
  }).length

  // Get unique departments
  const departments = Array.from(new Set(employees.map((emp) => emp.department)))

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Employee Management</h1>
          <p className="text-muted-foreground">Manage all employee records, profiles, and information.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddEmployeeModal(true)}>
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option>All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Name</th>
                <th className="text-left py-3 px-4 font-semibold">Email</th>
                <th className="text-left py-3 px-4 font-semibold">Department</th>
                <th className="text-left py-3 px-4 font-semibold">Role</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Join Date</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="py-4 px-4 font-medium">{emp.name}</td>
                    <td className="py-4 px-4">{emp.email}</td>
                    <td className="py-4 px-4">{emp.department}</td>
                    <td className="py-4 px-4">{emp.role}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          emp.status === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">{new Date(emp.join_date).toLocaleDateString()}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          className="p-1 hover:bg-secondary rounded transition-colors"
                          onClick={() => handleEditEmployee(emp)}
                          title="Edit employee"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 hover:bg-secondary rounded transition-colors"
                          onClick={() => handleDeleteEmployee(emp.id)}
                          title="Delete employee"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Employees</p>
          <p className="text-3xl font-bold">{totalEmployees}</p>
          <p className="text-xs text-green-600 mt-2">Active employees</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">New Hires (This Month)</p>
          <p className="text-3xl font-bold">{newHiresThisMonth}</p>
          <p className="text-xs text-blue-600 mt-2">On track with goals</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Departments</p>
          <p className="text-3xl font-bold">{departments.length}</p>
          <p className="text-xs text-blue-600 mt-2">Active departments</p>
        </Card>
      </div>

      <AddEmployeeModal
        isOpen={showAddEmployeeModal}
        onClose={handleCloseModal}
        onSubmit={handleAddNewEmployee}
      />
    </div>
  )
}
