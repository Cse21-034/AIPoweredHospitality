import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Clock, AlertCircle, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([
    {
      id: "S001",
      name: "Alice Johnson",
      role: "Manager",
      department: "Front Desk",
      email: "alice@hotel.com",
      phone: "555-0001",
      status: "Active",
      joinDate: "2023-01-15",
      salary: 52000,
      schedule: "Mon-Fri, 8AM-5PM",
      performance: "Excellent",
    },
    {
      id: "S002",
      name: "Bob Smith",
      role: "Housekeeping",
      department: "Housekeeping",
      email: "bob@hotel.com",
      phone: "555-0002",
      status: "Active",
      joinDate: "2023-03-20",
      salary: 28000,
      schedule: "Mon-Sat, 6AM-3PM",
      performance: "Good",
    },
    {
      id: "S003",
      name: "Carol Davis",
      role: "Chef",
      department: "Food & Beverage",
      email: "carol@hotel.com",
      phone: "555-0003",
      status: "Active",
      joinDate: "2022-07-10",
      salary: 45000,
      schedule: "Tue-Sat, 10AM-11PM",
      performance: "Excellent",
    },
    {
      id: "S004",
      name: "David Wilson",
      role: "Receptionist",
      department: "Front Desk",
      email: "david@hotel.com",
      phone: "555-0004",
      status: "On Leave",
      joinDate: "2023-06-01",
      salary: 32000,
      schedule: "Mon-Fri, 8AM-4PM",
      performance: "Good",
    },
    {
      id: "S005",
      name: "Emma Brown",
      role: "Security",
      department: "Security",
      email: "emma@hotel.com",
      phone: "555-0005",
      status: "Active",
      joinDate: "2023-02-14",
      salary: 35000,
      schedule: "24/7 Shifts",
      performance: "Very Good",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === "all" || staff.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const stats = [
    { label: "Total Staff", value: staffList.length, color: "text-blue-600" },
    { label: "Active", value: staffList.filter((s) => s.status === "Active").length, color: "text-green-600" },
    { label: "On Leave", value: staffList.filter((s) => s.status === "On Leave").length, color: "text-yellow-600" },
    { label: "Avg Salary", value: "$38,400", color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage staff records, schedules, and payroll
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>Enter staff details below</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Full Name" />
              <Input placeholder="Email" type="email" />
              <Input placeholder="Phone" />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Receptionist">Receptionist</SelectItem>
                  <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="Chef">Chef</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Salary" type="number" />
              <Button className="w-full">Add Staff Member</Button>
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="directory" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="directory">Staff Directory</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Staff Directory */}
        <TabsContent value="directory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={filterDept} onValueChange={setFilterDept}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Front Desk">Front Desk</SelectItem>
                    <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.name}</TableCell>
                        <TableCell>{staff.role}</TableCell>
                        <TableCell>{staff.department}</TableCell>
                        <TableCell>{staff.email}</TableCell>
                        <TableCell>{staff.phone}</TableCell>
                        <TableCell>
                          <Badge variant={staff.status === "Active" ? "default" : "secondary"}>
                            {staff.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(staff.joinDate).toLocaleDateString()}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
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
              <CardTitle>Staff Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffList.slice(0, 3).map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{staff.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {staff.schedule}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Edit Schedule</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              David Wilson is on leave from Dec 20 - Jan 5. Coverage assigned to Emma Brown.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Payroll */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payroll Management</CardTitle>
                  <CardDescription>November 2024 payroll</CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Payroll
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.name}</TableCell>
                        <TableCell>{staff.role}</TableCell>
                        <TableCell>${(staff.salary / 12).toFixed(2)}</TableCell>
                        <TableCell>160</TableCell>
                        <TableCell>${(staff.salary / 12 * 0.05).toFixed(2)}</TableCell>
                        <TableCell>${(staff.salary / 12 * 0.15).toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">${(staff.salary / 12 * 0.9).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="default">Processed</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList.map((staff) => (
              <Card key={staff.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{staff.name}</CardTitle>
                      <CardDescription>{staff.role}</CardDescription>
                    </div>
                    <Badge variant="outline">{staff.performance}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tenure</p>
                      <p className="font-semibold">
                        {Math.floor((new Date().getTime() - new Date(staff.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rating</p>
                      <p className="font-semibold">4.2/5</p>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">View Full Review</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
