# ប្រព័ន្ធគ្រប់គ្រងវត្តមានសិស្ស (SAMS - School Attendance Management System)

## ១. កំណត់ Objects

ប្រព័ន្ធគ្រប់គ្រងវត្តមានសិស្សក្នុងសាលារៀន យើងអាចកំណត់ Objects មួយចំនួនដូចជា៖
Student, Staff, Teacher, Guardian, Subject, SchoolClass, Schedule, Attendance, និង Leave

កំណត់ attributes៖

- **Student** មានដូចជា៖ id, student_id, name, gender, dob, phone, email, address, class_id, parent_name, parent_phone, guardian_id, image, department, major, academic_year, semester, enrollment_date, status
- **Staff** មានដូចជា៖ id, name, gender, dob, phone, email, address, position, salary, hire_date, image
- **Teacher** មានដូចជា៖ id, teacher_id, name, gender, dob, phone, email, address, position, salary, hire_date, image, department, status
- **Guardian** មានដូចជា៖ id, name, gender, dob, phone, email, address, relationship, emergency_contact, image
- **Subject** មានដូចជា៖ id, subject_name, description, course_code, credits, department, semester, academic_year, status
- **SchoolClass** មានដូចជា៖ id, class_name, teacher_id, academic_year, department, semester, room
- **Schedule** មានដូចជា៖ id, class_id, subject_id, teacher_id, day, time_start, time_end, room, recurrence
- **Attendance** មានដូចជា៖ id, student_id, schedule_id, staff_id, date, status
- **Leave** មានដូចជា៖ id, student_id, staff_id, date_from, date_to, reason, status

---

## ២. កំណត់ Classes

### Person (Class មេ)

```
Person {
    id, name, gender, dob, phone, email, address,
    Person(),
    Person(...),
    setID(...), getID(),
    setName(...), getName(),
    setGender(...), getGender(),
    setDob(...), getDob(),
    setPhone(...), getPhone(),
    setEmail(...), getEmail(),
    setAddress(...), getAddress()
}
```

### Student (Class កូន)

```
Student {
    student_id, class_id, parent_name, parent_phone,
    guardian_id, image, department, major,
    academic_year, semester, enrollment_date, status,
    Student(),
    Student(...),
    setStudentID(...), getStudentID(),
    setClassID(...), getClassID(),
    setParentName(...), getParentName(),
    setParentPhone(...), getParentPhone(),
    setDepartment(...), getDepartment(),
    setMajor(...), getMajor(),
    setImage(...), getImage()
}
```

### Staff (Class កូន)

```
Staff {
    position, salary, hire_date, image,
    Staff(),
    Staff(...),
    setPosition(...), getPosition(),
    setSalary(...), getSalary(),
    setHireDate(...), getHireDate(),
    setImage(...), getImage()
}
```

### Teacher (Class កូន)

```
Teacher {
    teacher_id, department, status,
    Teacher(),
    Teacher(...),
    setTeacherID(...), getTeacherID(),
    setPosition(...), getPosition(),
    setSalary(...), getSalary(),
    setHireDate(...), getHireDate(),
    setImage(...), getImage()
}
```

### Guardian (Class កូន)

```
Guardian {
    relationship, emergency_contact, image,
    Guardian(),
    Guardian(...),
    setRelationship(...), getRelationship(),
    setEmergencyContact(...), getEmergencyContact(),
    setImage(...), getImage()
}
```

---

### Event (Class មេ)

```
Event {
    id, staff_id, date,
    Event(),
    Event(...),
    setID(...), getID(),
    setStaffID(...), getStaffID(),
    setDate(...), getDate()
}
```

### Attendance (Class កូន)

```
Attendance {
    student_id, schedule_id, status,
    Attendance(),
    Attendance(...),
    setStudentID(...), getStudentID(),
    setScheduleID(...), getScheduleID(),
    setStatus(...), getStatus()
}
```

### Leave (Class កូន)

```
Leave {
    student_id, date_from, date_to, reason, status,
    Leave(),
    Leave(...),
    setStudentID(...), getStudentID(),
    setDateFrom(...), getDateFrom(),
    setDateTo(...), getDateTo(),
    setReason(...), getReason(),
    setStatus(...), getStatus()
}
```

---

### Subject (Class ឯករភ័យ)

```
Subject {
    id, subject_name, description, course_code,
    credits, department, semester, academic_year, status,
    Subject(),
    Subject(...),
    setID(...), getID(),
    setSubjectName(...), getSubjectName(),
    setDescription(...), getDescription()
}
```

### SchoolClass (Class ឯករភ័យ)

```
SchoolClass {
    id, class_name, teacher_id, academic_year,
    department, semester, room,
    SchoolClass(),
    SchoolClass(...),
    setID(...), getID(),
    setClassName(...), getClassName(),
    setTeacherID(...), getTeacherID(),
    setAcademicYear(...), getAcademicYear()
}
```

### Schedule (Class ឯករភ័យ)

```
Schedule {
    id, class_id, subject_id, teacher_id,
    day, time_start, time_end, room, recurrence,
    Schedule(),
    Schedule(...),
    setID(...), getID(),
    setClassID(...), getClassID(),
    setSubjectID(...), getSubjectID(),
    setTeacherID(...), getTeacherID(),
    setDay(...), getDay(),
    setTimeStart(...), getTimeStart(),
    setTimeEnd(...), getTimeEnd()
}
```

---

## ៣. Inheritance

### Inheritance ទី១៖ Person

- **Person** {id, name, gender, dob, phone, email, address} គឺជា Class មេ
- **Student** (student_id, class_id, parent_name, parent_phone, guardian_id, image) គឺជា Class កូន
- **Staff** (position, salary, hire_date, image) គឺជា Class កូន
- **Teacher** (teacher_id, department, status) គឺជា Class កូន
- **Guardian** (relationship, emergency_contact, image) គឺជា Class កូន

```
          Person
        /   |    \      \
  Student Staff Teacher Guardian
```

### Inheritance ទី២៖ Event

- **Event** {id, staff_id, date} គឺជា Class មេ
- **Attendance** (student_id, schedule_id, status) គឺជា Class កូន
- **Leave** (student_id, date_from, date_to, reason, status) គឺជា Class កូន

```
          Event
         /     \
  Attendance   Leave
```

---

## ៤. ទំនាក់ទំនងរវាង Classes (Relationships)

### Inheritance Relationships

| Class ទី១ | Class ទី១ | Class ទី២ | ប្រភេទទំនាក់ទំនង |
|---|---|---|---|
| Person | → | Student | Inheritance (is-a) |
| Person | → | Staff | Inheritance (is-a) |
| Person | → | Teacher | Inheritance (is-a) |
| Person | → | Guardian | Inheritance (is-a) |
| Event | → | Attendance | Inheritance (is-a) |
| Event | → | Leave | Inheritance (is-a) |

### Association Relationships

| Class ទី១ | ទំនាក់ទំនង | Class ទី២ | Minimum | Maximum | ប្រភេទ |
|---|---|---|---|---|---|
| Staff | — | Attendance | 1 | * | One to Many |
| Staff | — | Leave | 0 | * | One to Many |
| Staff | — | SchoolClass | 1 | * | One to Many |
| Staff | — | Schedule | 1 | * | One to Many |
| Student | — | Attendance | 1 | * | One to Many |
| Student | — | Leave | 0 | * | One to Many |
| Student | — | SchoolClass | 1 | 1 | Many to One |
| Student | — | Guardian | 0 | 1 | Many to One |
| Teacher | — | Subject | * | * | Many to Many |
| Teacher | — | SchoolClass | * | * | Many to Many |
| Teacher | — | Schedule | 1 | * | One to Many |
| SchoolClass | — | Student | 1 | * | One to Many |
| SchoolClass | — | Schedule | 1 | * | One to Many |
| SchoolClass | — | Subject | * | * | Many to Many |
| Subject | — | Schedule | 1 | * | One to Many |
| Schedule | — | Attendance | 1 | * | One to Many |

### ពន្យល់ប្រភេទទំនាក់ទំនង៖

- **Exactly One (1,1)**: ត្រូវមានច្រើនជាង ១ ជួរ
- **Zero or One (0,1)**: អាចគ្មាន ឬ មាន ១ ជួរ
- **Zero or More (0, *)**: អាចគ្មាន ឬ មានច្រើនជួរ
- **One or More (1, *)**: ត្រូវមាន ១ ឬ ច្រើនជួរ

---

## ៥. Interface Objects (Forms)

យើងអាចកំណត់ Interface Objects ចំនួន ៩ ដូចជា៖

- **FormStudent** ទាក់ទងជាមួយនឹង Classes ឈ្មោះ Student និង Person។
- **FormStaff** ទាក់ទងជាមួយនឹង Classes ឈ្មោះ Staff និង Person។
- **FormTeacher** ទាក់ទងជាមួយនឹង Classes ឈ្មោះ Teacher និង Person។
- **FormGuardian** ទាក់ទងជាមួយនឹង Classes ឈ្មោះ Guardian និង Person។
- **FormSubject** ទាក់ទងជាមួយនឹង Class ឈ្មោះ Subject។
- **FormClass** ទាក់ទងជាមួយនឹង Class ឈ្មោះ SchoolClass។
- **FormSchedule** ទាក់ទងជាមួយនឹង Classes ឈ្មោះ Schedule, SchoolClass, Teacher, Person, និង Subject។
- **FormAttendance** ទាក់ទងជាមួយនឹង Classes ឈ្មោះ Attendance, Event, Student, Staff, Person, Schedule, និង SchoolClass។
- **FormLeave** ទាក់ទងជាមួយនឹង Classes ឈ្មោះ Leave, Event, Student, Staff, និង Person។

---

## ៦. Class Diagram (Inheritance)

```
┌─────────────────────────────────────┐
│            <<abstract>>             │
│              Person                 │
├─────────────────────────────────────┤
│ - id: int                           │
│ - name: string                      │
│ - gender: string                    │
│ - dob: date                         │
│ - phone: string                     │
│ - email: string                     │
│ - address: text                     │
├─────────────────────────────────────┤
│ + setID(...), getID()              │
│ + setName(...), getName()          │
│ + setGender(...), getGender()      │
│ + setDob(...), getDob()            │
│ + setPhone(...), getPhone()        │
│ + setEmail(...), getEmail()        │
│ + setAddress(...), getAddress()    │
└──────────┬──────────┬──────────┬──────────┬─────┘
           │          │          │          │
     ┌─────┴──┐ ┌─────┴──┐ ┌────┴───┐ ┌────┴────┐
     │Student │ │ Staff  │ │Teacher │ │Guardian │
     ├────────┤ ├────────┤ ├────────┤ ├─────────┤
     │student │ │position│ │teacher │ │relation │
     │_id     │ │salary  │ │_id     │ │ship     │
     │class_id│ │hire_   │ │depart  │ │emergency│
     │parent  │ │date    │ │ment    │ │_contact │
     │_name   │ │image   │ │status  │ │image    │
     │parent  │ └────────┘ └────────┘ └─────────┘
     │_phone  │
     │guardian│
     │_id     │
     │image   │
     │depart  │
     │ment    │
     │major   │
     │academ  │
     │ic_year │
     │semester│
     │enroll  │
     │ment_   │
     │date    │
     │status  │
     └────────┘
```

```
┌─────────────────────────────────────┐
│            <<abstract>>             │
│              Event                  │
├─────────────────────────────────────┤
│ - id: int                           │
│ - staff_id: int                     │
│ - date: date                        │
├─────────────────────────────────────┤
│ + setID(...), getID()              │
│ + setStaffID(...), getStaffID()    │
│ + setDate(...), getDate()          │
└──────────┬──────────────────┬───────┘
           │                  │
     ┌─────┴──────────┐ ┌────┴──────────┐
     │   Attendance   │ │     Leave     │
     ├────────────────┤ ├───────────────┤
     │ - student_id   │ │ - student_id  │
     │ - schedule_id  │ │ - date_from   │
     │ - status       │ │ - date_to     │
     ├────────────────┤ │ - reason      │
     │ + setStudentID │ │ - status      │
     │ + getStudentID │ ├───────────────┤
     │ + setScheduleID│ │ + setStudentID│
     │ + getScheduleID│ │ + getStudentID│
     │ + setStatus    │ │ + setDateFrom │
     │ + getStatus    │ │ + getDateFrom │
     └────────────────┘ │ + setDateTo   │
                        │ + getDateTo   │
                        │ + setReason   │
                        │ + getReason   │
                        │ + setStatus   │
                        │ + getStatus   │
                        └───────────────┘
```

---

## ៧. Summary

| Class | Type | Parent | Attributes |
|---|---|---|---|
| Person | Abstract | - | id, name, gender, dob, phone, email, address |
| Student | Concrete | Person | student_id, class_id, parent_name, parent_phone, guardian_id, image, department, major, academic_year, semester, enrollment_date, status |
| Staff | Concrete | Person | position, salary, hire_date, image |
| Teacher | Concrete | Person | teacher_id, department, status |
| Guardian | Concrete | Person | relationship, emergency_contact, image |
| Event | Abstract | - | id, staff_id, date |
| Attendance | Concrete | Event | student_id, schedule_id, status |
| Leave | Concrete | Event | student_id, date_from, date_to, reason, status |
| Subject | Concrete | - | id, subject_name, description, course_code, credits, department, semester, academic_year, status |
| SchoolClass | Concrete | - | id, class_name, teacher_id, academic_year, department, semester, room |
| Schedule | Concrete | - | id, class_id, subject_id, teacher_id, day, time_start, time_end, room, recurrence |
