"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Search, Filter, X } from "lucide-react"

export function SearchFilterModule() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const allItems = [
    { id: 1, name: "Sarah Chen", type: "Employee", department: "Engineering", status: "Active" },
    { id: 2, name: "Expense Report #2023-001", type: "Expense", department: "Engineering", status: "Pending" },
    { id: 3, name: "Q4 Budget Review", type: "Document", department: "Finance", status: "Approved" },
    { id: 4, name: "Leave Request - Marcus Johnson", type: "Request", department: "Sales", status: "Pending" },
    { id: 5, name: "Office Equipment", type: "Asset", department: "Operations", status: "Active" },
    { id: 6, name: "Training Program 2024", type: "Training", department: "HR", status: "Active" },
  ]

  const filterOptions = [
    { category: "Type", options: ["Employee", "Expense", "Document", "Request", "Asset", "Training"] },
    { category: "Status", options: ["Active", "Pending", "Approved", "Rejected"] },
    { category: "Department", options: ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"] },
  ]

  const filteredItems = allItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilters =
      selectedFilters.length === 0 ||
      selectedFilters.some((filter) => item.type === filter || item.status === filter || item.department === filter)
    return matchesSearch && matchesFilters
  })

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]))
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Global Search & Filters</h1>
        <p className="text-muted-foreground">Search across all AdminOS modules with advanced filtering.</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employees, expenses, requests, documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-border">
            {filterOptions.map((filterGroup) => (
              <div key={filterGroup.category}>
                <p className="text-sm font-semibold mb-2">{filterGroup.category}</p>
                <div className="flex flex-wrap gap-2">
                  {filterGroup.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => toggleFilter(option)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        selectedFilters.includes(option)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {selectedFilters.length > 0 && (
              <div className="flex gap-2 pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {selectedFilters.map((filter) => (
                  <span key={filter} className="px-2 py-1 bg-secondary text-xs rounded-full flex items-center gap-1">
                    {filter}
                    <button onClick={() => toggleFilter(filter)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setSelectedFilters([])}>
                  Clear all
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold">Results: {filteredItems.length}</p>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer border border-transparent hover:border-border"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.department}</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">{item.type}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      item.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : item.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
