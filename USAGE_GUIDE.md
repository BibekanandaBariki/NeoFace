# NeoFace SuperAdmin Dashboard - Complete Usage Guide

## 🎯 Quick Start Guide

You're logged in as **SuperAdmin** with full system control. Here's how to use all features:

---

## 1️⃣ **Creating Admin Users**

### Steps:
1. Click on the **"Admins"** tab
2. Click **"Create Admin"** button
3. Fill in the form:
   - **Name**: Full name of the admin/faculty
   - **Email**: Unique email address
   - **Password**: Minimum 6 characters
   - **Department**: Department name
4. Click **"Create Admin"**
5. The admin can now log in and manage students/subjects

---

## 2️⃣ **Creating Students**

### Steps:
1. Click on the **"Students"** tab
2. Click **"Create Student"** button
3. Fill in the form:
   - **Full Name**: Student's full name
   - **Email**: Student's email (will be used for login)
   - **University ID**: Unique student ID
   - **Department**: Department name
   - **Semester**: 1-8
   - **Year**: Academic year
4. Click **"Create Student"**
5. After creation, a popup will show the login credentials:
   - **Email**: The email you entered
   - **Password**: Their University ID (same as the University ID field)
6. Student can now:
   - Login using their email and University ID as password
   - Register their face
   - View attendance

### Important: Student Login
- **Email**: The email address entered during creation
- **Password**: Their **University ID** (NOT a separate password)
- Example: If University ID is "U12345", password is "U12345"

### Student Management:
- **Approve/Reject**: Students with pending face registrations can be approved/rejected
- **Delete**: Remove students from the system

---

## 3️⃣ **Creating Subjects**

### Steps:
1. Click on the **"Subjects"** tab
2. Click **"Create Subject"** button
3. Fill in basic information:
   - **Subject Code**: e.g., CS101
   - **Subject Name**: e.g., Data Structures
   - **Department**: Department name
   - **Semester**: 1-8
   - **Credits**: Number of credits
   - **Faculty/Admin**: Select the admin who will teach this subject

### Adding Timetable Slots:
1. In the "Timetable Slots" section:
   - Select **Day** (Monday-Sunday)
   - Set **Start Time** (e.g., 09:00)
   - Set **End Time** (e.g., 10:30)
   - Enter **Room** number
2. Click **"Add Slot"** to add the time slot
3. Add multiple slots if the subject has multiple classes per week
4. Click **"Create Subject"**

### Example:
- **Subject**: Data Structures (CS101)
- **Slot 1**: Monday 09:00-10:30 (Room 201)
- **Slot 2**: Thursday 14:00-15:30 (Room 205)

---

## 4️⃣ **Managing Timetables**

### View Timetable:
1. Click on the **"Timetable"** tab
2. View the weekly schedule organized by days
3. See all subjects with their time slots and rooms

### Update Timetable:
1. Go to **"Subjects"** tab
2. Find the subject you want to update
3. Note: Timetable is set during subject creation
4. To update, you can edit the subject via API or recreate it

---

## 5️⃣ **Taking Attendance**

### Method 1: Face Recognition (Automatic)
1. Click on the **"Attendance"** tab
2. Select a **Subject** from the dropdown
3. Make sure the subject has timetable slots configured
4. Click **"Mark Attendance"** to start camera
5. Student looks at camera and rotates head
6. System automatically recognizes and marks attendance

### Method 2: Manual Marking (By Time Slot)
1. Scroll down to **"Manual Attendance Marking by Subject"**
2. Each subject shows its time slots
3. For each time slot (e.g., Monday 09:00-10:30):
   - See list of students enrolled in that subject
   - Click **"Present"** or **"Absent"** for each student
4. Attendance is marked for the current date

### Example Workflow:
```
Subject: Data Structures (CS101)
├── Slot 1: Monday 09:00-10:30 (Room 201)
│   ├── Student 1 → [Present] [Absent]
│   ├── Student 2 → [Present] [Absent]
│   └── Student 3 → [Present] [Absent]
└── Slot 2: Thursday 14:00-15:30 (Room 205)
    ├── Student 1 → [Present] [Absent]
    └── ...
```

---

## 6️⃣ **Student Face Registration Approval**

### Steps:
1. Students register their face through the Student Portal
2. Registration appears with **"Pending"** status
3. Go to **"Students"** tab
4. Find students with pending registrations
5. Click **"Approve"** to allow face recognition
6. Click **"Reject"** to deny (student can re-register)

---

## 7️⃣ **Analytics & Reports**

### View Analytics:
1. Click on the **"Analytics"** tab
2. See:
   - **Overall Statistics**: Attendance percentages, total classes
   - **Charts**: Pie charts (subject-wise), Line graphs (daily trends)
   - **Heatmap Calendar**: Visual daily attendance pattern

### 3D Visualization:
- In **"Overview"** tab, see interactive 3D globe
- Shows attendance data as 3D points
- Rotate and zoom to explore data

---

## 📋 **Workflow Example: Complete Setup**

### Step 1: Create System
1. Create **2-3 Admin users** (faculty members)
2. Create **10-20 Students**
3. Create **5-8 Subjects** with timetables

### Step 2: Assign Students to Subjects
- When creating subjects, students are automatically assigned based on department and semester
- Or manually assign via subject editing (requires API call)

### Step 3: Student Face Registration
1. Students log in to Student Portal
2. Register their face (circular head rotation)
3. Wait for admin approval

### Step 4: Approve Registrations
1. SuperAdmin/Admin approves face registrations
2. Students can now use face recognition

### Step 5: Mark Attendance
- **During Class Time**: Use Face Recognition
- **After Class**: Use Manual Marking by time slot
- **Bulk**: Mark multiple students at once for a specific slot

---

## 🔧 **Tips & Best Practices**

1. **Timetable Setup**:
   - Always create timetable slots when creating subjects
   - Include room numbers for better organization
   - Use consistent time formats (24-hour recommended)

2. **Student Management**:
   - Assign students to subjects by matching department and semester
   - Approve face registrations promptly for better attendance tracking

3. **Attendance Marking**:
   - Use Face Recognition during class for automatic marking
   - Use Manual marking for corrections or missed students
   - Attendance is date-specific (one record per student per subject per day)

4. **Subject Organization**:
   - Use clear subject codes (e.g., CS101, MAT201)
   - Assign appropriate faculty/admin to each subject
   - Link students automatically via department/semester matching

---

## 🚨 **Common Tasks**

### How to assign students to a subject?
- Currently, students are auto-assigned based on department and semester
- To manually assign: Use the Subjects API with student IDs array

### How to mark attendance for a specific time slot?
1. Go to **Attendance** tab
2. Scroll to **Manual Attendance Marking**
3. Find your subject
4. Locate the specific time slot section
5. Mark Present/Absent for each student in that slot

### How to update a subject's timetable?
- Currently, update via API: `PUT /api/timetable/:subjectId`
- Or recreate the subject with new timetable

---

## ✅ **System Status**

All features are now available in your SuperAdmin dashboard:
- ✅ Create Admin Users
- ✅ Create Students
- ✅ Create Subjects with Timetables
- ✅ View Weekly Timetable
- ✅ Mark Attendance (Face Recognition + Manual)
- ✅ Approve/Reject Face Registrations
- ✅ View Analytics & 3D Visualizations
- ✅ Delete Management (students, admins, subjects)

**Happy Managing!** 🎓

