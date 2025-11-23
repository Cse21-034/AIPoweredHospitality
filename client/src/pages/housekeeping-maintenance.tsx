import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckCircle, AlertCircle, Clock, Wrench, Home } from "lucide-react";

export default function HousekeepingMaintenance() {
  const [tasks, setTasks] = useState([
    {
      id: "T001",
      room: "101",
      type: "Cleaning",
      status: "Completed",
      assignedTo: "Bob Smith",
      createdAt: "2024-01-23 09:00",
      completedAt: "2024-01-23 10:45",
      notes: "Standard checkout cleaning",
      priority: "Normal",
    },
    {
      id: "T002",
      room: "202",
      type: "Maintenance",
      status: "In Progress",
      assignedTo: "John Doe",
      createdAt: "2024-01-23 08:30",
      completedAt: null,
      notes: "AC repair - replaced filter",
      priority: "High",
    },
    {
      id: "T003",
      room: "105",
      type: "Cleaning",
      status: "Pending",
      assignedTo: "Unassigned",
      createdAt: "2024-01-23 11:00",
      completedAt: null,
      notes: "Deep clean requested by guest",
      priority: "High",
    },
    {
      id: "T004",
      room: "301",
      type: "Inspection",
      status: "In Progress",
      assignedTo: "Emma Brown",
      createdAt: "2024-01-23 10:00",
      completedAt: null,
      notes: "Weekly safety inspection",
      priority: "Normal",
    },
  ]);

  const [equipment, setEquipment] = useState([
    {
      id: "EQ001",
      name: "Central AC Unit",
      location: "Roof - Building A",
      status: "Good",
      lastMaintenance: "2024-01-20",
      nextMaintenance: "2024-02-20",
      condition: 95,
    },
    {
      id: "EQ002",
      name: "Dishwashing Machine",
      location: "Kitchen",
      status: "Needs Attention",
      lastMaintenance: "2024-01-10",
      nextMaintenance: "2024-01-30",
      condition: 65,
    },
    {
      id: "EQ003",
      name: "Elevator #1",
      location: "Main Lobby",
      status: "Good",
      lastMaintenance: "2024-01-15",
      nextMaintenance: "2024-04-15",
      condition: 88,
    },
    {
      id: "EQ004",
      name: "Water Heating System",
      location: "Basement",
      status: "Good",
      lastMaintenance: "2024-01-05",
      nextMaintenance: "2024-03-05",
      condition: 92,
    },
  ]);

  const stats = [
    {
      label: "Today's Tasks",
      value: tasks.length,
      pending: tasks.filter((t) => t.status === "Pending").length,
      color: "text-blue-600",
    },
    {
      label: "Completed Today",
      value: tasks.filter((t) => t.status === "Completed").length,
      pending: 0,
      color: "text-green-600",
    },
    {
      label: "In Progress",
      value: tasks.filter((t) => t.status === "In Progress").length,
      pending: 0,
      color: "text-yellow-600",
    },
    {
      label: "Equipment Status",
      value: "95%",
      pending: 1,
      color: "text-purple-600",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Housekeeping & Maintenance</h1>
          <p className="text-muted-foreground mt-2">
            Manage cleaning tasks, maintenance requests, and equipment
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a new cleaning or maintenance task</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Room Number" />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Task Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cleaning">Cleaning</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Inspection">Inspection</SelectItem>
                  <SelectItem value="Repair">Repair</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Notes" as="textarea" />
              <Button className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                {stat.pending > 0 && <p className="text-xs text-red-600">↑ {stat.pending} pending</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">Work Orders</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Work Orders */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Orders</CardTitle>
              <CardDescription>Today's cleaning and maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className={`border-2 rounded-lg p-4 ${getStatusColor(task.status)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {task.type === "Cleaning" ? (
                          <Home className="w-5 h-5" />
                        ) : (
                          <Wrench className="w-5 h-5" />
                        )}
                        <div>
                          <p className="font-semibold">Room {task.room} - {task.type}</p>
                          <p className="text-sm opacity-75">{task.notes}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{task.priority}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="opacity-75">Assigned To</p>
                        <p className="font-medium">{task.assignedTo}</p>
                      </div>
                      <div>
                        <p className="opacity-75">Started</p>
                        <p className="font-medium">{task.createdAt.split(" ")[1]}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {task.status === "Pending" && (
                        <Button size="sm" className="flex-1">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Assign
                        </Button>
                      )}
                      {task.status === "In Progress" && (
                        <Button size="sm" className="flex-1">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete
                        </Button>
                      )}
                      {task.status === "Completed" && (
                        <p className="text-sm font-medium opacity-75">Completed {task.completedAt}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment */}
        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Inventory</CardTitle>
              <CardDescription>Building equipment and maintenance schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Last Maintenance</TableHead>
                      <TableHead>Next Maintenance</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "Good" ? "default" : "destructive"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  item.condition >= 80 ? "bg-green-600" : item.condition >= 60 ? "bg-yellow-600" : "bg-red-600"
                                }`}
                                style={{ width: `${item.condition}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{item.condition}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.lastMaintenance}</TableCell>
                        <TableCell>
                          {new Date(item.nextMaintenance) < new Date() ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            item.nextMaintenance
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Schedule</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>Upcoming preventive maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    date: "2024-01-25",
                    equipment: "Elevator #2",
                    type: "Annual Inspection",
                    duration: "4 hours",
                  },
                  {
                    date: "2024-01-28",
                    equipment: "Dishwashing Machine",
                    type: "Service & Parts",
                    duration: "2 hours",
                  },
                  {
                    date: "2024-02-15",
                    equipment: "HVAC System",
                    type: "Filter Replacement",
                    duration: "1 hour",
                  },
                  {
                    date: "2024-02-20",
                    equipment: "AC Unit",
                    type: "Quarterly Maintenance",
                    duration: "3 hours",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{item.equipment}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.type} ({item.duration})
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{item.date}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
