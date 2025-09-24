"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Station {
  id: string
  name: string
  type: "billiard" | "ps4"
  status: "available" | "occupied" | "maintenance"
  hourlyRate: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function StationManagement() {
  const {
    data: stations = [],
    error,
    mutate,
  } = useSWR<Station[]>("/api/stations", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds (reduced from 5s)
    revalidateOnFocus: false, // Don't refetch when window gets focus
    revalidateOnReconnect: true, // Only refetch on network reconnect
  })

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newStation, setNewStation] = useState({
    name: "",
    type: "billiard" as "billiard" | "ps4",
    hourlyRate: 15,
  })

  const handleAddStation = async () => {
    try {
      const response = await fetch("/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStation),
      })

      if (response.ok) {
        const newStationData = await response.json()
        mutate([...stations, newStationData], false) // Optimistic update
        setNewStation({ name: "", type: "billiard", hourlyRate: 15 })
        setIsAddDialogOpen(false)
      }
    } catch (error) {
      console.error("Error adding station:", error)
    }
  }

  const updateStationStatus = async (id: string, status: Station["status"]) => {
    try {
      const response = await fetch(`/api/stations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        mutate(
          stations.map((station) => (station.id === id ? { ...station, status } : station)),
          false,
        )
      }
    } catch (error) {
      console.error("Error updating station status:", error)
    }
  }

  const updateStationRate = async (id: string, hourlyRate: number) => {
    try {
      const response = await fetch(`/api/stations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate }),
      })

      if (response.ok) {
        mutate(
          stations.map((station) => (station.id === id ? { ...station, hourlyRate } : station)),
          false,
        )
      }
    } catch (error) {
      console.error("Error updating station rate:", error)
    }
  }

  const removeStation = async (id: string) => {
    try {
      const response = await fetch(`/api/stations/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        mutate(
          stations.filter((station) => station.id !== id),
          false,
        )
      }
    } catch (error) {
      console.error("Error removing station:", error)
    }
  }

  const getStatusColor = (status: Station["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "occupied":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "maintenance":
        return "bg-red-100 text-red-800 border-red-200"
    }
  }

  const getTypeIcon = (type: Station["type"]) => {
    return type === "billiard" ? "🎱" : "🎮"
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold mb-2">Error Loading Stations</h3>
        <p className="text-muted-foreground">Please check your Google Sheets connection</p>
      </div>
    )
  }

  if (!stations) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stations.length}</div>
            <div className="text-sm text-muted-foreground">Total Stations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stations.filter((s) => s.status === "available").length}
            </div>
            <div className="text-sm text-muted-foreground">Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stations.filter((s) => s.status === "occupied").length}
            </div>
            <div className="text-sm text-muted-foreground">Occupied</div>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg">Add New Station</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Station</DialogTitle>
              <DialogDescription>Create a new billiard table or PS4 station</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Station Name</Label>
                <Input
                  id="name"
                  value={newStation.name}
                  onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                  placeholder="e.g., Billiard Table 3"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="type">Station Type</Label>
                <Select
                  value={newStation.type}
                  onValueChange={(value: "billiard" | "ps4") => setNewStation({ ...newStation, type: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="billiard">🎱 Billiard Table</SelectItem>
                    <SelectItem value="ps4">🎮 PS4 Station</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rate">Hourly Rate ($)</Label>
                <Input
                  id="rate"
                  type="number"
                  value={newStation.hourlyRate}
                  onChange={(e) => setNewStation({ ...newStation, hourlyRate: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
              <Button onClick={handleAddStation} className="w-full rounded-xl">
                Add Station
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stations.map((station) => (
          <Card key={station.id} className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {getTypeIcon(station.type)} {station.name}
                </CardTitle>
                <Badge className={`rounded-full ${getStatusColor(station.status)}`}>{station.status}</Badge>
              </div>
              <CardDescription>${station.hourlyRate}/hour</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select
                  value={station.status}
                  onValueChange={(value: Station["status"]) => updateStationStatus(station.id, value)}
                >
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  value={station.hourlyRate}
                  onChange={(e) => updateStationRate(station.id, Number(e.target.value))}
                  className="rounded-xl text-sm"
                  placeholder="Rate"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeStation(station.id)}
                  className="rounded-xl"
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
