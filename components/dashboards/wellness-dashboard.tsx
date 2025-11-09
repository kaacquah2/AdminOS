"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Heart,
  Users,
  Calendar,
  Trophy,
  Award,
  TrendingUp,
  Activity,
  Smile,
  Target,
  BookOpen,
  BarChart3,
  Plus,
  Star,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { 
  getWellnessPrograms,
  getWellnessChallenges,
  getWellnessEvents,
  getWellnessSurveys,
  getWellnessResources,
  getEmployeeWellnessPoints,
  getEmployeeWellnessBadges,
  getWellnessLeaderboard,
} from "@/lib/database"
import { NewWellnessProgramModal } from "@/components/modals/new-wellness-program-modal"
import { NewWellnessChallengeModal } from "@/components/modals/new-wellness-challenge-modal"

export function WellnessDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showNewProgram, setShowNewProgram] = useState(false)
  const [showNewChallenge, setShowNewChallenge] = useState(false)
  
  // Data states
  const [programs, setPrograms] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [surveys, setSurveys] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [myPoints, setMyPoints] = useState<any[]>([])
  const [myBadges, setMyBadges] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  // Metrics
  const [metrics, setMetrics] = useState({
    activePrograms: 0,
    activeChallenges: 0,
    upcomingEvents: 0,
    totalParticipants: 0,
    engagementRate: 0,
    myTotalPoints: 0,
    myRank: 0,
    activeSurveys: 0,
  })

  const isManager = user?.role === "wellness_manager" || 
                    user?.role === "dept_manager" || 
                    user?.role === "super_admin" ||
                    user?.department === "Employee Wellness & Engagement"

  useEffect(() => {
    loadWellnessData()
  }, [user])

  async function loadWellnessData() {
    if (!user) return

    try {
      setLoading(true)

      // Load programs
      const programsData = await getWellnessPrograms()
      setPrograms(programsData || [])

      // Load challenges
      const challengesData = await getWellnessChallenges()
      setChallenges(challengesData || [])

      // Load events
      const eventsData = await getWellnessEvents()
      setEvents(eventsData || [])

      // Load surveys
      const surveysData = await getWellnessSurveys()
      setSurveys(surveysData || [])

      // Load resources
      const resourcesData = await getWellnessResources({ is_featured: true })
      setResources(resourcesData || [])

      // Load employee-specific data
      if (!isManager) {
        const pointsData = await getEmployeeWellnessPoints(user.id)
        setMyPoints(pointsData || [])
        
        const badgesData = await getEmployeeWellnessBadges(user.id)
        setMyBadges(badgesData || [])

        const leaderboardData = await getWellnessLeaderboard(undefined, 10)
        setLeaderboard(leaderboardData || [])
        
        // Calculate rank
        const myTotal = (pointsData || []).reduce((sum: number, p: any) => sum + (p.points_earned || 0), 0)
        const rank = leaderboardData?.findIndex((entry: any) => entry.employee_id === user.id) + 1 || 0
        
        setMetrics(prev => ({
          ...prev,
          myTotalPoints: myTotal,
          myRank: rank || 0,
        }))
      }

      // Calculate metrics
      const activePrograms = (programsData || []).filter((p: any) => p.status === "active").length
      const activeChallenges = (challengesData || []).filter((c: any) => c.status === "active").length
      
      const now = new Date()
      const upcomingEvents = (eventsData || []).filter((e: any) => {
        const eventDate = new Date(e.event_date)
        return e.status === "scheduled" && eventDate >= now
      }).length

      const totalParticipants = (programsData || []).reduce((sum: number, p: any) => sum + (p.current_participants || 0), 0) +
                                (challengesData || []).reduce((sum: number, c: any) => sum + (c.current_participants || 0), 0)

      // Get total employees for engagement rate
      const { data: employees } = await supabase
        .from("employees")
        .select("id")
        .eq("status", "Active")

      const totalEmployees = employees?.length || 1
      const engagementRate = totalEmployees > 0 ? Math.round((totalParticipants / totalEmployees) * 100) : 0

      const activeSurveys = (surveysData || []).filter((s: any) => s.status === "active").length

      setMetrics(prev => ({
        ...prev,
        activePrograms,
        activeChallenges,
        upcomingEvents,
        totalParticipants,
        engagementRate,
        activeSurveys,
      }))
    } catch (error) {
      console.error("Error loading wellness data:", error)
      toast({
        title: "Error",
        description: "Failed to load wellness data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Programs by type
  const programsByType = programs.reduce((acc: any, p: any) => {
    acc[p.program_type] = (acc[p.program_type] || 0) + 1
    return acc
  }, {})

  const programTypeData = Object.entries(programsByType).map(([type, count]) => ({
    type: type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }))

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"]

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading Wellness dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Employee Wellness & Engagement Dashboard</h1>
          <p className="text-muted-foreground">
            {isManager 
              ? "Manage wellness programs, challenges, events, and track employee engagement."
              : "Track your wellness journey, participate in challenges, and earn rewards."}
          </p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Button onClick={() => setShowNewProgram(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Program
            </Button>
            <Button variant="outline" onClick={() => setShowNewChallenge(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Challenge
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          {!isManager && <TabsTrigger value="my-wellness">My Wellness</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Programs</p>
                    <p className="text-3xl font-bold">{metrics.activePrograms}</p>
                    <p className="text-xs text-muted-foreground mt-1">{programs.length} total</p>
                  </div>
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Challenges</p>
                    <p className="text-3xl font-bold">{metrics.activeChallenges}</p>
                    <p className="text-xs text-muted-foreground mt-1">{challenges.length} total</p>
                  </div>
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Engagement Rate</p>
                    <p className="text-3xl font-bold">{metrics.engagementRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{metrics.totalParticipants} participants</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Upcoming Events</p>
                    <p className="text-3xl font-bold">{metrics.upcomingEvents}</p>
                    <p className="text-xs text-muted-foreground mt-1">Next 30 days</p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee-specific metrics */}
          {!isManager && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">My Wellness Points</p>
                      <p className="text-3xl font-bold">{metrics.myTotalPoints}</p>
                      <p className="text-xs text-muted-foreground mt-1">Keep earning!</p>
                    </div>
                    <Zap className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">My Rank</p>
                      <p className="text-3xl font-bold">#{metrics.myRank || "-"}</p>
                      <p className="text-xs text-muted-foreground mt-1">On leaderboard</p>
                    </div>
                    <Award className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Badges Earned</p>
                      <p className="text-3xl font-bold">{myBadges.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Achievements unlocked</p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Programs by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {programTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={programTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, count }) => `${type}: ${count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {programTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No program data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Participation Rate</span>
                      <span>{metrics.engagementRate}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full ${
                          metrics.engagementRate >= 70 ? "bg-green-600" :
                          metrics.engagementRate >= 50 ? "bg-yellow-600" :
                          "bg-red-600"
                        }`}
                        style={{ width: `${Math.min(metrics.engagementRate, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Participants</p>
                      <p className="font-semibold">{metrics.totalParticipants}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Active Programs</p>
                      <p className="font-semibold">{metrics.activePrograms}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {events.filter((e: any) => {
                  const eventDate = new Date(e.event_date)
                  return e.status === "scheduled" && eventDate >= new Date()
                }).slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No upcoming events</div>
                ) : (
                  <div className="space-y-3">
                    {events.filter((e: any) => {
                      const eventDate = new Date(e.event_date)
                      return e.status === "scheduled" && eventDate >= new Date()
                    }).slice(0, 5).map((event: any) => (
                      <div key={event.id} className="p-3 bg-secondary rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{event.event_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(event.event_date).toLocaleDateString()} • {event.start_time} - {event.end_time}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{event.location || "Virtual"}</p>
                          </div>
                          <Badge className={
                            event.event_format === "virtual" ? "bg-blue-100 text-blue-800" :
                            event.event_format === "hybrid" ? "bg-purple-100 text-purple-800" :
                            "bg-green-100 text-green-800"
                          }>
                            {event.event_format}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                {challenges.filter((c: any) => c.status === "active").slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No active challenges</div>
                ) : (
                  <div className="space-y-3">
                    {challenges.filter((c: any) => c.status === "active").slice(0, 5).map((challenge: any) => (
                      <div key={challenge.id} className="p-3 bg-secondary rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{challenge.challenge_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {challenge.challenge_type.replace("_", " ")} • {challenge.current_participants} participants
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Ends: {new Date(challenge.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {challenge.participation_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wellness Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Program #</th>
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Participants</th>
                      <th className="text-left py-3 px-4 font-semibold">Start Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No wellness programs
                        </td>
                      </tr>
                    ) : (
                      programs.map((program: any) => (
                        <tr key={program.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{program.program_number}</td>
                          <td className="py-4 px-4">{program.program_name}</td>
                          <td className="py-4 px-4">{program.program_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              program.status === "active" ? "bg-green-100 text-green-800" :
                              program.status === "completed" ? "bg-blue-100 text-blue-800" :
                              program.status === "planned" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {program.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">{program.current_participants} / {program.participation_limit || "∞"}</td>
                          <td className="py-4 px-4">{new Date(program.start_date).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wellness Challenges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Challenge #</th>
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Participants</th>
                      <th className="text-left py-3 px-4 font-semibold">End Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {challenges.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No wellness challenges
                        </td>
                      </tr>
                    ) : (
                      challenges.map((challenge: any) => (
                        <tr key={challenge.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{challenge.challenge_number}</td>
                          <td className="py-4 px-4">{challenge.challenge_name}</td>
                          <td className="py-4 px-4">{challenge.challenge_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              challenge.status === "active" ? "bg-green-100 text-green-800" :
                              challenge.status === "completed" ? "bg-blue-100 text-blue-800" :
                              challenge.status === "upcoming" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {challenge.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">{challenge.current_participants} / {challenge.max_participants || "∞"}</td>
                          <td className="py-4 px-4">{new Date(challenge.end_date).toLocaleDateString()}</td>
                          <td className="py-4 px-4">{challenge.reward_type || "N/A"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wellness Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Event #</th>
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Time</th>
                      <th className="text-left py-3 px-4 font-semibold">Location</th>
                      <th className="text-left py-3 px-4 font-semibold">Attendees</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          No wellness events
                        </td>
                      </tr>
                    ) : (
                      events.map((event: any) => (
                        <tr key={event.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{event.event_number}</td>
                          <td className="py-4 px-4">{event.event_name}</td>
                          <td className="py-4 px-4">{event.event_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">{new Date(event.event_date).toLocaleDateString()}</td>
                          <td className="py-4 px-4">{event.start_time} - {event.end_time}</td>
                          <td className="py-4 px-4">{event.location || "Virtual"}</td>
                          <td className="py-4 px-4">{event.current_attendees} / {event.max_attendees || "∞"}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              event.status === "completed" ? "bg-green-100 text-green-800" :
                              event.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                              event.status === "scheduled" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {event.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wellness Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No wellness resources available
                  </div>
                ) : (
                  resources.map((resource: any) => (
                    <Card key={resource.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm">{resource.resource_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{resource.resource_type}</p>
                          </div>
                          {resource.is_featured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{resource.description}</p>
                        )}
                        {resource.category && (
                          <Badge variant="outline" className="text-xs">{resource.category}</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Wellness Tab (Employee View) */}
        {!isManager && (
          <TabsContent value="my-wellness" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Points History</CardTitle>
                </CardHeader>
                <CardContent>
                  {myPoints.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No points earned yet. Join challenges and attend events to earn points!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myPoints.slice(0, 10).map((point: any) => (
                        <div key={point.id} className="p-3 bg-secondary rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">{point.activity_description || point.points_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(point.earned_date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className="bg-purple-100 text-purple-800">
                              +{point.points_earned} pts
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Badges</CardTitle>
                </CardHeader>
                <CardContent>
                  {myBadges.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No badges earned yet. Complete challenges to earn badges!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {myBadges.map((award: any) => (
                        <div key={award.id} className="p-4 bg-secondary rounded-lg text-center">
                          <Award className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                          <p className="text-sm font-semibold">{award.wellness_badges?.badge_name || "Badge"}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(award.awarded_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No leaderboard data available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry: any, index: number) => (
                      <div 
                        key={entry.employee_id} 
                        className={`p-3 rounded-lg flex items-center justify-between ${
                          entry.employee_id === user?.id ? "bg-yellow-50 border-2 border-yellow-300" : "bg-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? "bg-yellow-500 text-white" :
                            index === 1 ? "bg-gray-400 text-white" :
                            index === 2 ? "bg-orange-500 text-white" :
                            "bg-gray-200 text-gray-600"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {entry.employee_name} {entry.employee_id === user?.id && "(You)"}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">
                          {entry.total_points || 0} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      <NewWellnessProgramModal
        isOpen={showNewProgram}
        onClose={() => setShowNewProgram(false)}
        onSuccess={() => {
          loadWellnessData()
        }}
      />
      <NewWellnessChallengeModal
        isOpen={showNewChallenge}
        onClose={() => setShowNewChallenge(false)}
        onSuccess={() => {
          loadWellnessData()
        }}
      />
    </div>
  )
}

