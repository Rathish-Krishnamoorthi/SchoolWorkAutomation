import type {
  Student, Teacher, Class, Subject, Room, Period, Day,
  TimetableConflict, AttendanceRecord, DocumentRecord,
  Alert, Notification, ResourcePrediction, AuditLog,
  DailyAttendanceSummary, AttendanceDataPoint
} from '@/types';

// ─────────────────────────────────────────────
// STUDENTS (realistic Indian school data)
// ─────────────────────────────────────────────
export const DEMO_STUDENTS: Student[] = [
  { id:'s1', studentId:'STU-1001', name:'Rathish Kumar', photo:'', dateOfBirth:'2010-04-12', gender:'male', classId:'c10a', className:'Grade 10', section:'A', parentName:'Rajesh Kumar', parentContact:'9876543210', email:'rathish@example.com', address:'14, Gandhi Street, Coimbatore', admissionDate:'2019-06-10', attendancePercentage:82, status:'active', bloodGroup:'B+', nationality:'Indian' },
  { id:'s2', studentId:'STU-1002', name:'Priya Venkatesh', photo:'', dateOfBirth:'2010-07-22', gender:'female', classId:'c10a', className:'Grade 10', section:'A', parentName:'Venkatesh R', parentContact:'9845321100', email:'', address:'32, Anna Nagar, Chennai', admissionDate:'2019-06-10', attendancePercentage:95, status:'active', bloodGroup:'O+', nationality:'Indian' },
  { id:'s3', studentId:'STU-1003', name:'Arun Selvam', photo:'', dateOfBirth:'2010-01-15', gender:'male', classId:'c10b', className:'Grade 10', section:'B', parentName:'Selvam K', parentContact:'9900112233', email:'', address:'7, RS Puram, Coimbatore', admissionDate:'2019-06-10', attendancePercentage:71, status:'active', bloodGroup:'A+', nationality:'Indian' },
  { id:'s4', studentId:'STU-1004', name:'Divya Lakshmi', photo:'', dateOfBirth:'2010-09-05', gender:'female', classId:'c10b', className:'Grade 10', section:'B', parentName:'Lakshmi M', parentContact:'9988776655', email:'', address:'22, Peelamedu, Coimbatore', admissionDate:'2020-06-08', attendancePercentage:91, status:'active', bloodGroup:'AB+', nationality:'Indian' },
  { id:'s5', studentId:'STU-1005', name:'Mohammed Irfan', photo:'', dateOfBirth:'2011-03-18', gender:'male', classId:'c9a', className:'Grade 9', section:'A', parentName:'Irfan Sheikh', parentContact:'9765432100', email:'', address:'45, Ukkadam, Coimbatore', admissionDate:'2020-06-08', attendancePercentage:88, status:'active', bloodGroup:'O-', nationality:'Indian' },
  { id:'s6', studentId:'STU-1006', name:'Sneha Ramesh', photo:'', dateOfBirth:'2011-11-30', gender:'female', classId:'c9a', className:'Grade 9', section:'A', parentName:'Ramesh N', parentContact:'9655432199', email:'', address:'12, Saibaba Colony, Coimbatore', admissionDate:'2020-06-08', attendancePercentage:97, status:'active', bloodGroup:'B+', nationality:'Indian' },
  { id:'s7', studentId:'STU-1007', name:'Karthik Suresh', photo:'', dateOfBirth:'2011-06-25', gender:'male', classId:'c9b', className:'Grade 9', section:'B', parentName:'Suresh B', parentContact:'9543219876', email:'', address:'88, Race Course, Coimbatore', admissionDate:'2020-06-08', attendancePercentage:74, status:'active', bloodGroup:'A-', nationality:'Indian' },
  { id:'s8', studentId:'STU-1008', name:'Ananya Krishnan', photo:'', dateOfBirth:'2012-02-14', gender:'female', classId:'c8a', className:'Grade 8', section:'A', parentName:'Krishnan S', parentContact:'9432187650', email:'', address:'56, Singanallur, Coimbatore', admissionDate:'2021-06-07', attendancePercentage:86, status:'active', bloodGroup:'O+', nationality:'Indian' },
  { id:'s9', studentId:'STU-1009', name:'Vikram Nair', photo:'', dateOfBirth:'2012-08-19', gender:'male', classId:'c8a', className:'Grade 8', section:'A', parentName:'Nair V', parentContact:'9321098765', email:'', address:'23, Ganapathy, Coimbatore', admissionDate:'2021-06-07', attendancePercentage:63, status:'active', bloodGroup:'B-', nationality:'Indian' },
  { id:'s10', studentId:'STU-1010', name:'Kavya Mohan', photo:'', dateOfBirth:'2012-12-03', gender:'female', classId:'c8b', className:'Grade 8', section:'B', parentName:'Mohan R', parentContact:'9210987654', email:'', address:'11, Vadavalli, Coimbatore', admissionDate:'2021-06-07', attendancePercentage:92, status:'active', bloodGroup:'AB-', nationality:'Indian' },
  { id:'s11', studentId:'STU-1011', name:'Sanjay Pillai', photo:'', dateOfBirth:'2013-04-07', gender:'male', classId:'c7a', className:'Grade 7', section:'A', parentName:'Pillai M', parentContact:'9109876543', email:'', address:'67, Saravanampatti, Coimbatore', admissionDate:'2022-06-06', attendancePercentage:79, status:'active', bloodGroup:'O+', nationality:'Indian' },
  { id:'s12', studentId:'STU-1012', name:'Meera Subramanian', photo:'', dateOfBirth:'2013-07-21', gender:'female', classId:'c7a', className:'Grade 7', section:'A', parentName:'Subramanian P', parentContact:'9098765432', email:'', address:'34, Ondipudur, Coimbatore', admissionDate:'2022-06-06', attendancePercentage:100, status:'active', bloodGroup:'A+', nationality:'Indian' },
  { id:'s13', studentId:'STU-1013', name:'Rohit Sharma', photo:'', dateOfBirth:'2013-10-15', gender:'male', classId:'c7b', className:'Grade 7', section:'B', parentName:'Sharma A', parentContact:'8987654321', email:'', address:'90, Sowripalayam, Coimbatore', admissionDate:'2022-06-06', attendancePercentage:68, status:'active', bloodGroup:'B+', nationality:'Indian' },
  { id:'s14', studentId:'STU-1014', name:'Pooja Rajendran', photo:'', dateOfBirth:'2014-01-28', gender:'female', classId:'c6a', className:'Grade 6', section:'A', parentName:'Rajendran K', parentContact:'8876543210', email:'', address:'45, Hopes College, Coimbatore', admissionDate:'2023-06-05', attendancePercentage:94, status:'active', bloodGroup:'O+', nationality:'Indian' },
  { id:'s15', studentId:'STU-1015', name:'Arjun Babu', photo:'', dateOfBirth:'2014-05-10', gender:'male', classId:'c6a', className:'Grade 6', section:'A', parentName:'Babu S', parentContact:'8765432109', email:'', address:'78, Eachanari, Coimbatore', admissionDate:'2023-06-05', attendancePercentage:87, status:'active', bloodGroup:'A-', nationality:'Indian' },
  { id:'s16', studentId:'STU-1016', name:'Nithya Chandran', photo:'', dateOfBirth:'2014-09-12', gender:'female', classId:'c6b', className:'Grade 6', section:'B', parentName:'Chandran T', parentContact:'8654321098', email:'', address:'23, Podanur, Coimbatore', admissionDate:'2023-06-05', attendancePercentage:55, status:'active', bloodGroup:'B-', nationality:'Indian' },
  { id:'s17', studentId:'STU-1017', name:'Surya Prakash', photo:'', dateOfBirth:'2009-11-06', gender:'male', classId:'c11a', className:'Grade 11', section:'A', parentName:'Prakash N', parentContact:'8543210987', email:'', address:'12, Civil Aerodrome, Coimbatore', admissionDate:'2018-06-11', attendancePercentage:77, status:'active', bloodGroup:'AB+', nationality:'Indian' },
  { id:'s18', studentId:'STU-1018', name:'Lakshmi Priya', photo:'', dateOfBirth:'2009-03-14', gender:'female', classId:'c11a', className:'Grade 11', section:'A', parentName:'Priya V', parentContact:'8432109876', email:'', address:'56, Maruthamalai Road, Coimbatore', admissionDate:'2018-06-11', attendancePercentage:89, status:'active', bloodGroup:'O+', nationality:'Indian' },
  { id:'s19', studentId:'STU-1019', name:'Dinesh Babu', photo:'', dateOfBirth:'2008-07-19', gender:'male', classId:'c12a', className:'Grade 12', section:'A', parentName:'Babu K', parentContact:'8321098765', email:'', address:'33, Sulur, Coimbatore', admissionDate:'2017-06-12', attendancePercentage:91, status:'active', bloodGroup:'A+', nationality:'Indian' },
  { id:'s20', studentId:'STU-1020', name:'Sangeetha Raj', photo:'', dateOfBirth:'2008-12-25', gender:'female', classId:'c12a', className:'Grade 12', section:'A', parentName:'Raj M', parentContact:'8210987654', email:'', address:'89, Kuniyamuthur, Coimbatore', admissionDate:'2017-06-12', attendancePercentage:98, status:'active', bloodGroup:'B+', nationality:'Indian' },
  { id:'s21', studentId:'STU-1021', name:'Bharath Rajan', photo:'', dateOfBirth:'2010-06-02', gender:'male', classId:'c10a', className:'Grade 10', section:'A', parentName:'Rajan B', parentContact:'7876543210', email:'', address:'67, Pappanaickenpalayam, Coimbatore', admissionDate:'2019-06-10', attendancePercentage:72, status:'active', bloodGroup:'O-', nationality:'Indian' },
  { id:'s22', studentId:'STU-1022', name:'Deepa Murugan', photo:'', dateOfBirth:'2011-09-17', gender:'female', classId:'c9a', className:'Grade 9', section:'A', parentName:'Murugan R', parentContact:'7765432109', email:'', address:'45, Kovilpalayam, Coimbatore', admissionDate:'2020-06-08', attendancePercentage:85, status:'active', bloodGroup:'A+', nationality:'Indian' },
  { id:'s23', studentId:'STU-1023', name:'Vishal Anand', photo:'', dateOfBirth:'2012-04-08', gender:'male', classId:'c8b', className:'Grade 8', section:'B', parentName:'Anand V', parentContact:'7654321098', email:'', address:'12, Thudiyalur, Coimbatore', admissionDate:'2021-06-07', attendancePercentage:60, status:'active', bloodGroup:'B+', nationality:'Indian' },
  { id:'s24', studentId:'STU-1024', name:'Anjali Menon', photo:'', dateOfBirth:'2013-12-29', gender:'female', classId:'c7b', className:'Grade 7', section:'B', parentName:'Menon P', parentContact:'7543210987', email:'', address:'78, Perur, Coimbatore', admissionDate:'2022-06-06', attendancePercentage:93, status:'active', bloodGroup:'AB-', nationality:'Indian' },
  { id:'s25', studentId:'STU-1025', name:'Nikhil Venu', photo:'', dateOfBirth:'2014-08-11', gender:'male', classId:'c6b', className:'Grade 6', section:'B', parentName:'Venu S', parentContact:'7432109876', email:'', address:'34, Kinathukadavu, Coimbatore', admissionDate:'2023-06-05', attendancePercentage:76, status:'active', bloodGroup:'O+', nationality:'Indian' },
];

// ─────────────────────────────────────────────
// TEACHERS
// ─────────────────────────────────────────────
export const DEMO_TEACHERS: Teacher[] = [
  { id:'t1', teacherId:'TCH-001', name:'Mr. Suresh Kumar', photo:'', department:'Mathematics', subjects:['Mathematics','Statistics'], classes:['Grade 9','Grade 10','Grade 11'], email:'suresh.kumar@school.edu', phone:'9876500001', qualification:'M.Sc. Mathematics, B.Ed', experience:12, joiningDate:'2012-06-01', workload:94, status:'active', availability:{ Monday:['08:30','09:30','10:30'], Tuesday:['09:30','10:30','11:30'], Wednesday:['08:30','09:30'], Thursday:['10:30','11:30','14:30'], Friday:['08:30','09:30','10:30'] } },
  { id:'t2', teacherId:'TCH-002', name:'Ms. Priya Nair', photo:'', department:'Science', subjects:['Physics','Chemistry'], classes:['Grade 10','Grade 11','Grade 12'], email:'priya.nair@school.edu', phone:'9876500002', qualification:'M.Sc. Physics, B.Ed', experience:9, joiningDate:'2015-06-01', workload:92, status:'active', availability:{ Monday:['09:30','10:30','14:30'], Tuesday:['08:30','09:30'], Wednesday:['10:30','11:30','14:30'], Thursday:['08:30','09:30'], Friday:['09:30','10:30','11:30'] } },
  { id:'t3', teacherId:'TCH-003', name:'Mr. Arun Babu', photo:'', department:'Languages', subjects:['English','Tamil'], classes:['Grade 6','Grade 7','Grade 8'], email:'arun.babu@school.edu', phone:'9876500003', qualification:'M.A. English, B.Ed', experience:7, joiningDate:'2017-06-01', workload:91, status:'active', availability:{ Monday:['08:30','09:30','10:30','11:30'], Tuesday:['08:30','09:30','10:30'], Wednesday:['08:30','09:30','10:30'], Thursday:['08:30','09:30'], Friday:['08:30','09:30','10:30','11:30'] } },
  { id:'t4', teacherId:'TCH-004', name:'Ms. Kavitha Rajan', photo:'', department:'Social Science', subjects:['History','Geography','Civics'], classes:['Grade 8','Grade 9','Grade 10'], email:'kavitha.rajan@school.edu', phone:'9876500004', qualification:'M.A. History, B.Ed', experience:5, joiningDate:'2019-06-01', workload:78, status:'active', availability:{ Monday:['10:30','11:30','14:30'], Tuesday:['09:30','10:30','11:30'], Wednesday:['09:30','10:30'], Thursday:['11:30','14:30'], Friday:['10:30','11:30'] } },
  { id:'t5', teacherId:'TCH-005', name:'Mr. Rajesh Pillai', photo:'', department:'Computer Science', subjects:['Computer Science','Information Technology'], classes:['Grade 9','Grade 10','Grade 11','Grade 12'], email:'rajesh.pillai@school.edu', phone:'9876500005', qualification:'MCA, B.Ed', experience:8, joiningDate:'2016-06-01', workload:85, status:'active', availability:{ Monday:['11:30','14:30','15:30'], Tuesday:['08:30','09:30','14:30'], Wednesday:['11:30','14:30'], Thursday:['08:30','09:30','10:30'], Friday:['14:30','15:30'] } },
  { id:'t6', teacherId:'TCH-006', name:'Ms. Deepa Sharma', photo:'', department:'Science', subjects:['Biology'], classes:['Grade 9','Grade 10','Grade 11','Grade 12'], email:'deepa.sharma@school.edu', phone:'9876500006', qualification:'M.Sc. Biology, B.Ed', experience:6, joiningDate:'2018-06-01', workload:82, status:'active', availability:{ Monday:['08:30','09:30'], Tuesday:['11:30','14:30'], Wednesday:['08:30','09:30','10:30'], Thursday:['09:30','10:30','14:30'], Friday:['08:30','09:30','11:30'] } },
  { id:'t7', teacherId:'TCH-007', name:'Mr. Mohan Krishnan', photo:'', department:'Mathematics', subjects:['Mathematics'], classes:['Grade 6','Grade 7','Grade 8'], email:'mohan.krishnan@school.edu', phone:'9876500007', qualification:'M.Sc. Mathematics, B.Ed', experience:15, joiningDate:'2009-06-01', workload:75, status:'active', availability:{ Monday:['09:30','10:30','11:30'], Tuesday:['08:30','09:30','10:30'], Wednesday:['09:30','10:30','11:30'], Thursday:['08:30','09:30','10:30'], Friday:['09:30','10:30'] } },
  { id:'t8', teacherId:'TCH-008', name:'Ms. Anitha Menon', photo:'', department:'Languages', subjects:['Hindi','Sanskrit'], classes:['Grade 6','Grade 7','Grade 8','Grade 9'], email:'anitha.menon@school.edu', phone:'9876500008', qualification:'M.A. Hindi, B.Ed', experience:10, joiningDate:'2014-06-01', workload:70, status:'active', availability:{ Monday:['08:30','09:30','10:30'], Tuesday:['08:30','09:30'], Wednesday:['08:30','09:30','10:30'], Thursday:['08:30','09:30','10:30'], Friday:['08:30','09:30'] } },
  { id:'t9', teacherId:'TCH-009', name:'Mr. Subramaniam V', photo:'', department:'Arts & PE', subjects:['Physical Education','Art'], classes:['Grade 6','Grade 7','Grade 8','Grade 9','Grade 10'], email:'subbu.v@school.edu', phone:'9876500009', qualification:'B.P.Ed, M.P.Ed', experience:11, joiningDate:'2013-06-01', workload:65, status:'active', availability:{ Monday:['14:30','15:30'], Tuesday:['14:30','15:30'], Wednesday:['14:30','15:30'], Thursday:['14:30','15:30'], Friday:['14:30','15:30'] } },
  { id:'t10', teacherId:'TCH-010', name:'Ms. Meena Sundaram', photo:'', department:'Science', subjects:['Chemistry','Physics'], classes:['Grade 8','Grade 9'], email:'meena.sundaram@school.edu', phone:'9876500010', qualification:'M.Sc. Chemistry, B.Ed', experience:4, joiningDate:'2020-06-01', workload:80, status:'active', availability:{ Monday:['10:30','11:30'], Tuesday:['10:30','11:30','14:30'], Wednesday:['10:30','11:30'], Thursday:['10:30','11:30','14:30'], Friday:['10:30','11:30'] } },
  { id:'t11', teacherId:'TCH-011', name:'Mr. Vijay Chandran', photo:'', department:'Social Science', subjects:['Economics','Commerce'], classes:['Grade 11','Grade 12'], email:'vijay.chandran@school.edu', phone:'9876500011', qualification:'M.Com, B.Ed', experience:13, joiningDate:'2011-06-01', workload:72, status:'active', availability:{ Monday:['09:30','10:30','11:30'], Tuesday:['09:30','10:30'], Wednesday:['09:30','10:30','11:30'], Thursday:['09:30','10:30'], Friday:['09:30','10:30','11:30'] } },
  { id:'t12', teacherId:'TCH-012', name:'Ms. Radha Gopalan', photo:'', department:'Mathematics', subjects:['Mathematics','Statistics'], classes:['Grade 11','Grade 12'], email:'radha.gopalan@school.edu', phone:'9876500012', qualification:'M.Sc. Statistics, B.Ed', experience:3, joiningDate:'2021-06-01', workload:68, status:'on_leave', availability:{ Monday:['08:30','09:30'], Tuesday:['08:30','09:30','10:30'], Wednesday:['08:30'], Thursday:['08:30','09:30'], Friday:['08:30','09:30','10:30'] } },
];

// ─────────────────────────────────────────────
// CLASSES
// ─────────────────────────────────────────────
export const DEMO_CLASSES: Class[] = [
  { id:'c6a', name:'Grade 6 - A', grade:6, section:'A', classTeacherId:'t3', classTeacherName:'Mr. Arun Babu', roomId:'r101', studentCount:42, subjects:['Mathematics','English','Tamil','Science','Social Science','Hindi'], academicYear:'2025-26' },
  { id:'c6b', name:'Grade 6 - B', grade:6, section:'B', classTeacherId:'t8', classTeacherName:'Ms. Anitha Menon', roomId:'r102', studentCount:40, subjects:['Mathematics','English','Tamil','Science','Social Science','Hindi'], academicYear:'2025-26' },
  { id:'c7a', name:'Grade 7 - A', grade:7, section:'A', classTeacherId:'t7', classTeacherName:'Mr. Mohan Krishnan', roomId:'r103', studentCount:44, subjects:['Mathematics','English','Tamil','Science','Social Science','Hindi'], academicYear:'2025-26' },
  { id:'c7b', name:'Grade 7 - B', grade:7, section:'B', classTeacherId:'t3', classTeacherName:'Mr. Arun Babu', roomId:'r104', studentCount:41, subjects:['Mathematics','English','Tamil','Science','Social Science','Hindi'], academicYear:'2025-26' },
  { id:'c8a', name:'Grade 8 - A', grade:8, section:'A', classTeacherId:'t10', classTeacherName:'Ms. Meena Sundaram', roomId:'r201', studentCount:45, subjects:['Mathematics','English','Tamil','Physics','Chemistry','Biology','Social Science'], academicYear:'2025-26' },
  { id:'c8b', name:'Grade 8 - B', grade:8, section:'B', classTeacherId:'t4', classTeacherName:'Ms. Kavitha Rajan', roomId:'r202', studentCount:43, subjects:['Mathematics','English','Tamil','Physics','Chemistry','Biology','Social Science'], academicYear:'2025-26' },
  { id:'c9a', name:'Grade 9 - A', grade:9, section:'A', classTeacherId:'t6', classTeacherName:'Ms. Deepa Sharma', roomId:'r203', studentCount:46, subjects:['Mathematics','English','Tamil','Physics','Chemistry','Biology','History','Computer Science'], academicYear:'2025-26' },
  { id:'c9b', name:'Grade 9 - B', grade:9, section:'B', classTeacherId:'t4', classTeacherName:'Ms. Kavitha Rajan', roomId:'r204', studentCount:44, subjects:['Mathematics','English','Tamil','Physics','Chemistry','Biology','History','Computer Science'], academicYear:'2025-26' },
  { id:'c10a', name:'Grade 10 - A', grade:10, section:'A', classTeacherId:'t1', classTeacherName:'Mr. Suresh Kumar', roomId:'r205', studentCount:48, subjects:['Mathematics','English','Tamil','Physics','Chemistry','Biology','History','Computer Science'], academicYear:'2025-26' },
  { id:'c10b', name:'Grade 10 - B', grade:10, section:'B', classTeacherId:'t2', classTeacherName:'Ms. Priya Nair', roomId:'r301', studentCount:46, subjects:['Mathematics','English','Tamil','Physics','Chemistry','Biology','History','Computer Science'], academicYear:'2025-26' },
  { id:'c11a', name:'Grade 11 - A', grade:11, section:'A', classTeacherId:'t5', classTeacherName:'Mr. Rajesh Pillai', roomId:'r302', studentCount:40, subjects:['Mathematics','Physics','Chemistry','Biology','Computer Science','English'], academicYear:'2025-26' },
  { id:'c12a', name:'Grade 12 - A', grade:12, section:'A', classTeacherId:'t11', classTeacherName:'Mr. Vijay Chandran', roomId:'r303', studentCount:38, subjects:['Mathematics','Physics','Chemistry','Biology','Computer Science','English','Economics'], academicYear:'2025-26' },
];

// ─────────────────────────────────────────────
// SUBJECTS
// ─────────────────────────────────────────────
export const DEMO_SUBJECTS: Subject[] = [
  { id:'sub1', name:'Mathematics', code:'MAT', teacherId:'t1', teacherName:'Mr. Suresh Kumar', classes:['c9a','c9b','c10a','c10b','c11a'], weeklyPeriods:6, priority:'core', department:'Mathematics' },
  { id:'sub2', name:'Physics', code:'PHY', teacherId:'t2', teacherName:'Ms. Priya Nair', classes:['c10a','c10b','c11a','c12a'], weeklyPeriods:5, priority:'core', department:'Science' },
  { id:'sub3', name:'Chemistry', code:'CHM', teacherId:'t10', teacherName:'Ms. Meena Sundaram', classes:['c8a','c8b','c9a','c9b'], weeklyPeriods:5, priority:'core', department:'Science' },
  { id:'sub4', name:'Biology', code:'BIO', teacherId:'t6', teacherName:'Ms. Deepa Sharma', classes:['c9a','c9b','c10a','c10b'], weeklyPeriods:4, priority:'core', department:'Science' },
  { id:'sub5', name:'English', code:'ENG', teacherId:'t3', teacherName:'Mr. Arun Babu', classes:['c6a','c6b','c7a','c7b','c8a'], weeklyPeriods:5, priority:'core', department:'Languages' },
  { id:'sub6', name:'Tamil', code:'TAM', teacherId:'t3', teacherName:'Mr. Arun Babu', classes:['c6a','c6b','c7a'], weeklyPeriods:4, priority:'core', department:'Languages' },
  { id:'sub7', name:'Hindi', code:'HIN', teacherId:'t8', teacherName:'Ms. Anitha Menon', classes:['c6a','c6b','c7a','c7b','c8a','c8b'], weeklyPeriods:3, priority:'core', department:'Languages' },
  { id:'sub8', name:'History', code:'HIS', teacherId:'t4', teacherName:'Ms. Kavitha Rajan', classes:['c8a','c8b','c9a','c9b','c10a'], weeklyPeriods:3, priority:'core', department:'Social Science' },
  { id:'sub9', name:'Computer Science', code:'CS', teacherId:'t5', teacherName:'Mr. Rajesh Pillai', classes:['c9a','c9b','c10a','c10b','c11a','c12a'], weeklyPeriods:4, priority:'core', department:'Computer Science' },
  { id:'sub10', name:'Physical Education', code:'PE', teacherId:'t9', teacherName:'Mr. Subramaniam V', classes:['c6a','c6b','c7a','c7b','c8a','c8b','c9a','c9b','c10a'], weeklyPeriods:2, priority:'activity', department:'Arts & PE' },
  { id:'sub11', name:'Economics', code:'ECO', teacherId:'t11', teacherName:'Mr. Vijay Chandran', classes:['c11a','c12a'], weeklyPeriods:4, priority:'core', department:'Social Science' },
  { id:'sub12', name:'Statistics', code:'STA', teacherId:'t12', teacherName:'Ms. Radha Gopalan', classes:['c11a','c12a'], weeklyPeriods:3, priority:'elective', department:'Mathematics' },
];

// ─────────────────────────────────────────────
// ROOMS
// ─────────────────────────────────────────────
export const DEMO_ROOMS = [
  { id:'r101', name:'Room 101', type:'classroom' as const, capacity:50, floor:1, building:'Main Block', facilities:['Projector','Whiteboard'], utilizationPercent:88 },
  { id:'r102', name:'Room 102', type:'classroom' as const, capacity:50, floor:1, building:'Main Block', facilities:['Projector','Whiteboard'], utilizationPercent:82 },
  { id:'r103', name:'Room 103', type:'classroom' as const, capacity:50, floor:1, building:'Main Block', facilities:['Whiteboard'], utilizationPercent:90 },
  { id:'r104', name:'Room 104', type:'classroom' as const, capacity:50, floor:1, building:'Main Block', facilities:['Whiteboard'], utilizationPercent:75 },
  { id:'r201', name:'Room 201', type:'classroom' as const, capacity:50, floor:2, building:'Main Block', facilities:['Projector','Whiteboard','AC'], utilizationPercent:92 },
  { id:'r202', name:'Room 202', type:'classroom' as const, capacity:50, floor:2, building:'Main Block', facilities:['Projector','Whiteboard'], utilizationPercent:85 },
  { id:'r203', name:'Room 203', type:'classroom' as const, capacity:50, floor:2, building:'Main Block', facilities:['Whiteboard'], utilizationPercent:78 },
  { id:'r204', name:'Room 204', type:'classroom' as const, capacity:50, floor:2, building:'Main Block', facilities:['Projector','Whiteboard'], utilizationPercent:95 },
  { id:'r205', name:'Room 205', type:'classroom' as const, capacity:50, floor:2, building:'Main Block', facilities:['Projector','Whiteboard','AC'], utilizationPercent:88 },
  { id:'r301', name:'Room 301', type:'classroom' as const, capacity:50, floor:3, building:'Main Block', facilities:['Whiteboard'], utilizationPercent:65 },
  { id:'r302', name:'Room 302', type:'classroom' as const, capacity:50, floor:3, building:'Main Block', facilities:['Projector','Whiteboard'], utilizationPercent:72 },
  { id:'r303', name:'Room 303', type:'classroom' as const, capacity:50, floor:3, building:'Main Block', facilities:['Projector','Whiteboard','AC'], utilizationPercent:80 },
  { id:'lab1', name:'Physics Lab', type:'lab' as const, capacity:30, floor:1, building:'Science Block', facilities:['Equipment','Whiteboard'], utilizationPercent:70 },
  { id:'lab2', name:'Chemistry Lab', type:'lab' as const, capacity:30, floor:1, building:'Science Block', facilities:['Equipment','Fume Hood'], utilizationPercent:65 },
  { id:'lab3', name:'Biology Lab', type:'lab' as const, capacity:30, floor:2, building:'Science Block', facilities:['Microscopes','Specimens'], utilizationPercent:58 },
  { id:'lab4', name:'Computer Lab', type:'lab' as const, capacity:40, floor:2, building:'Science Block', facilities:['Computers','Projector','Internet'], utilizationPercent:88 },
  { id:'hall1', name:'Assembly Hall', type:'hall' as const, capacity:500, floor:0, building:'Main Block', facilities:['Stage','Sound System','AC'], utilizationPercent:30 },
];

// ─────────────────────────────────────────────
// TIMETABLE PERIODS
// ─────────────────────────────────────────────
export const DEMO_PERIODS: Period[] = [
  // Monday - Grade 10A
  { id:'p1', day:'Monday', startTime:'08:30', endTime:'09:30', subjectId:'sub1', subjectName:'Mathematics', teacherId:'t1', teacherName:'Mr. Suresh Kumar', classId:'c10a', className:'Grade 10-A', roomId:'r205', roomName:'Room 205' },
  { id:'p2', day:'Monday', startTime:'09:30', endTime:'10:30', subjectId:'sub2', subjectName:'Physics', teacherId:'t2', teacherName:'Ms. Priya Nair', classId:'c10a', className:'Grade 10-A', roomId:'r205', roomName:'Room 205' },
  { id:'p3', day:'Monday', startTime:'10:30', endTime:'11:30', subjectId:'sub4', subjectName:'Biology', teacherId:'t6', teacherName:'Ms. Deepa Sharma', classId:'c10a', className:'Grade 10-A', roomId:'r205', roomName:'Room 205' },
  { id:'p4', day:'Monday', startTime:'11:30', endTime:'12:30', subjectId:'sub5', subjectName:'English', teacherId:'t3', teacherName:'Mr. Arun Babu', classId:'c10a', className:'Grade 10-A', roomId:'r205', roomName:'Room 205' },
  { id:'p5', day:'Monday', startTime:'13:30', endTime:'14:30', subjectId:'sub9', subjectName:'Computer Science', teacherId:'t5', teacherName:'Mr. Rajesh Pillai', classId:'c10a', className:'Grade 10-A', roomId:'lab4', roomName:'Computer Lab' },
  { id:'p6', day:'Monday', startTime:'14:30', endTime:'15:30', subjectId:'sub8', subjectName:'History', teacherId:'t4', teacherName:'Ms. Kavitha Rajan', classId:'c10a', className:'Grade 10-A', roomId:'r205', roomName:'Room 205' },

  // Monday - Grade 10B (conflict: t2 double-booked at 09:30, same as c10a)
  { id:'p7', day:'Monday', startTime:'08:30', endTime:'09:30', subjectId:'sub3', subjectName:'Chemistry', teacherId:'t10', teacherName:'Ms. Meena Sundaram', classId:'c10b', className:'Grade 10-B', roomId:'r301', roomName:'Room 301' },
  { id:'p8', day:'Monday', startTime:'09:30', endTime:'10:30', subjectId:'sub1', subjectName:'Mathematics', teacherId:'t1', teacherName:'Mr. Suresh Kumar', classId:'c10b', className:'Grade 10-B', roomId:'r301', roomName:'Room 301' }, // CONFLICT: t1 double booked
  { id:'p9', day:'Monday', startTime:'10:30', endTime:'11:30', subjectId:'sub2', subjectName:'Physics', teacherId:'t2', teacherName:'Ms. Priya Nair', classId:'c10b', className:'Grade 10-B', roomId:'r301', roomName:'Room 301' },
  { id:'p10', day:'Monday', startTime:'11:30', endTime:'12:30', subjectId:'sub9', subjectName:'Computer Science', teacherId:'t5', teacherName:'Mr. Rajesh Pillai', classId:'c10b', className:'Grade 10-B', roomId:'lab4', roomName:'Computer Lab' },
  { id:'p11', day:'Monday', startTime:'13:30', endTime:'14:30', subjectId:'sub4', subjectName:'Biology', teacherId:'t6', teacherName:'Ms. Deepa Sharma', classId:'c10b', className:'Grade 10-B', roomId:'r301', roomName:'Room 301' },
  { id:'p12', day:'Monday', startTime:'14:30', endTime:'15:30', subjectId:'sub5', subjectName:'English', teacherId:'t3', teacherName:'Mr. Arun Babu', classId:'c10b', className:'Grade 10-B', roomId:'r301', roomName:'Room 301' },

  // Tuesday
  { id:'p13', day:'Tuesday', startTime:'08:30', endTime:'09:30', subjectId:'sub5', subjectName:'English', teacherId:'t3', teacherName:'Mr. Arun Babu', classId:'c10a', className:'Grade 10-A', roomId:'r205', roomName:'Room 205' },
  { id:'p14', day:'Tuesday', startTime:'09:30', endTime:'10:30', subjectId:'sub1', subjectName:'Mathematics', teacherId:'t1', teacherName:'Mr. Suresh Kumar', classId:'c10a', className:'Grade 10-A', roomId:'r205', roomName:'Room 205' },
  { id:'p15', day:'Tuesday', startTime:'10:30', endTime:'11:30', subjectId:'sub3', subjectName:'Chemistry', teacherId:'t10', teacherName:'Ms. Meena Sundaram', classId:'c10a', className:'Grade 10-A', roomId:'lab2', roomName:'Chemistry Lab' },
  { id:'p16', day:'Tuesday', startTime:'11:30', endTime:'12:30', subjectId:'sub2', subjectName:'Physics', teacherId:'t2', teacherName:'Ms. Priya Nair', classId:'c10a', className:'Grade 10-A', roomId:'lab1', roomName:'Physics Lab' },
  { id:'p17', day:'Tuesday', startTime:'13:30', endTime:'14:30', subjectId:'sub8', subjectName:'History', teacherId:'t4', teacherName:'Ms. Kavitha Rajan', classId:'c10a', className:'Grade 10-A', roomId:'r205', roomName:'Room 205' },
  { id:'p18', day:'Tuesday', startTime:'14:30', endTime:'15:30', subjectId:'sub4', subjectName:'Biology', teacherId:'t6', teacherName:'Ms. Deepa Sharma', classId:'c10a', className:'Grade 10-A', roomId:'lab3', roomName:'Biology Lab' },

  // Room 204 double-booked conflict (Wednesday 10:30)
  { id:'p19', day:'Wednesday', startTime:'08:30', endTime:'09:30', subjectId:'sub1', subjectName:'Mathematics', teacherId:'t1', teacherName:'Mr. Suresh Kumar', classId:'c10a', className:'Grade 10-A', roomId:'r205', roomName:'Room 205' },
  { id:'p20', day:'Wednesday', startTime:'09:30', endTime:'10:30', subjectId:'sub2', subjectName:'Physics', teacherId:'t2', teacherName:'Ms. Priya Nair', classId:'c10a', className:'Grade 10-A', roomId:'r205', roomName:'Room 205' },
  { id:'p21', day:'Wednesday', startTime:'10:30', endTime:'11:30', subjectId:'sub9', subjectName:'Computer Science', teacherId:'t5', teacherName:'Mr. Rajesh Pillai', classId:'c10a', className:'Grade 10-A', roomId:'r204', roomName:'Room 204' },
  { id:'p22', day:'Wednesday', startTime:'10:30', endTime:'11:30', subjectId:'sub8', subjectName:'History', teacherId:'t4', teacherName:'Ms. Kavitha Rajan', classId:'c9a', className:'Grade 9-A', roomId:'r204', roomName:'Room 204' }, // ROOM CONFLICT
  { id:'p23', day:'Wednesday', startTime:'11:30', endTime:'12:30', subjectId:'sub5', subjectName:'English', teacherId:'t3', teacherName:'Mr. Arun Babu', classId:'c10a', className:'Grade 10-A', roomId:'r205', roomName:'Room 205' },
];

// ─────────────────────────────────────────────
// TIMETABLE CONFLICTS
// ─────────────────────────────────────────────
export const DEMO_CONFLICTS: TimetableConflict[] = [
  { id:'con1', type:'teacher_double_booked', severity:'critical', description:'Mr. Suresh Kumar is assigned to both Grade 10-A and Grade 10-B at Monday 09:30–10:30', affectedPeriods:['p1','p8'], day:'Monday', time:'09:30', resolved:false },
  { id:'con2', type:'room_double_booked', severity:'critical', description:'Room 204 is assigned to Grade 10-A (Computer Science) and Grade 9-A (History) at Wednesday 10:30–11:30', affectedPeriods:['p21','p22'], day:'Wednesday', time:'10:30', resolved:false },
  { id:'con3', type:'overload', severity:'warning', description:'Mr. Suresh Kumar has 94% workload — exceeds recommended 85% threshold', affectedPeriods:[], day:'Monday', time:'', resolved:false },
  { id:'con4', type:'overload', severity:'warning', description:'Ms. Priya Nair has 92% workload — exceeds recommended 85% threshold', affectedPeriods:[], day:'Monday', time:'', resolved:false },
  { id:'con5', type:'overload', severity:'warning', description:'Mr. Arun Babu has 91% workload — exceeds recommended 85% threshold', affectedPeriods:[], day:'Monday', time:'', resolved:false },
];

// ─────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────
export const DEMO_ATTENDANCE: AttendanceRecord[] = DEMO_STUDENTS.slice(0, 20).map((s, i) => ({
  id: `att-${i}`,
  studentId: s.id,
  studentName: s.name,
  classId: s.classId,
  date: '2026-08-15',
  status: i % 8 === 0 ? 'absent' : i % 10 === 3 ? 'late' : 'present',
  markedBy: 'Admin',
  mode: 'manual' as const,
  time: '08:35',
}));

export const DEMO_ATTENDANCE_TREND: AttendanceDataPoint[] = [
  { date: '2026-08-01', percentage: 92, present: 1104, absent: 96 },
  { date: '2026-08-04', percentage: 95, present: 1140, absent: 60 },
  { date: '2026-08-05', percentage: 91, present: 1092, absent: 108 },
  { date: '2026-08-06', percentage: 93, present: 1116, absent: 84 },
  { date: '2026-08-07', percentage: 89, present: 1068, absent: 132 },
  { date: '2026-08-08', percentage: 94, present: 1128, absent: 72 },
  { date: '2026-08-11', percentage: 96, present: 1152, absent: 48 },
  { date: '2026-08-12', percentage: 90, present: 1080, absent: 120 },
  { date: '2026-08-13', percentage: 93, present: 1116, absent: 84 },
  { date: '2026-08-14', percentage: 97, present: 1164, absent: 36 },
  { date: '2026-08-15', percentage: 94.2, present: 1204, absent: 74 },
];

export const DEMO_DAILY_SUMMARIES: DailyAttendanceSummary[] = DEMO_CLASSES.map(c => ({
  date: '2026-08-15',
  classId: c.id,
  className: c.name,
  totalStudents: c.studentCount,
  present: Math.round(c.studentCount * 0.94),
  absent: Math.round(c.studentCount * 0.04),
  late: Math.round(c.studentCount * 0.02),
  excused: 0,
  percentage: 94 + Math.random() * 4 - 2,
}));

// ─────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────
export const DEMO_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'doc1',
    fileName: 'rathish_admission_form.pdf',
    fileType: 'application/pdf',
    fileSize: 245000,
    documentType: 'admission_form',
    status: 'pending_approval',
    uploadedAt: '2026-08-15T08:30:00',
    processedAt: '2026-08-15T08:30:45',
    uploadedBy: 'Admin',
    extractedFields: [
      { key: 'studentName', label: 'Student Name', value: 'Rathish Kumar', confidence: 98 },
      { key: 'dateOfBirth', label: 'Date of Birth', value: '12/04/2010', confidence: 94 },
      { key: 'parentName', label: 'Parent Name', value: 'Rajesh Kumar', confidence: 89 },
      { key: 'phone', label: 'Phone Number', value: '9876543210', confidence: 99 },
      { key: 'address', label: 'Address', value: '14, Gandhi Street, Coimbatore', confidence: 81, isLowConfidence: true },
      { key: 'gender', label: 'Gender', value: 'Male', confidence: 97 },
      { key: 'bloodGroup', label: 'Blood Group', value: 'B+', confidence: 76, isLowConfidence: true },
      { key: 'class', label: 'Class', value: 'Grade 10', confidence: 92 },
    ],
  },
  {
    id: 'doc2',
    fileName: 'sneha_transfer_cert.jpg',
    fileType: 'image/jpeg',
    fileSize: 185000,
    documentType: 'transfer_certificate',
    status: 'approved',
    uploadedAt: '2026-08-14T11:20:00',
    processedAt: '2026-08-14T11:21:10',
    approvedAt: '2026-08-14T12:05:00',
    uploadedBy: 'Admin',
    extractedFields: [
      { key: 'studentName', label: 'Student Name', value: 'Sneha Ramesh', confidence: 99 },
      { key: 'previousSchool', label: 'Previous School', value: 'St. Mary\'s High School', confidence: 91 },
      { key: 'dateOfLeaving', label: 'Date of Leaving', value: '31/05/2025', confidence: 95 },
      { key: 'grade', label: 'Grade Completed', value: 'Grade 8', confidence: 88 },
    ],
  },
  {
    id: 'doc3',
    fileName: 'ananya_krishnan_reg.pdf',
    fileType: 'application/pdf',
    fileSize: 320000,
    documentType: 'registration_form',
    status: 'processing',
    uploadedAt: '2026-08-15T09:15:00',
    uploadedBy: 'Admin',
    extractedFields: [],
  },
  {
    id: 'doc4',
    fileName: 'teacher_mohan_form.pdf',
    fileType: 'application/pdf',
    fileSize: 210000,
    documentType: 'teacher_form',
    status: 'pending_approval',
    uploadedAt: '2026-08-15T07:55:00',
    processedAt: '2026-08-15T07:55:55',
    uploadedBy: 'Admin',
    extractedFields: [
      { key: 'teacherName', label: 'Teacher Name', value: 'Mohan Krishnan', confidence: 96 },
      { key: 'qualification', label: 'Qualification', value: 'M.Sc. Mathematics', confidence: 88 },
      { key: 'experience', label: 'Experience (Years)', value: '15', confidence: 93 },
      { key: 'department', label: 'Department', value: 'Mathematics', confidence: 97 },
      { key: 'phone', label: 'Phone', value: '9876500007', confidence: 99 },
      { key: 'dob', label: 'Date of Birth', value: '15/06/1985', confidence: 72, isLowConfidence: true },
    ],
  },
  {
    id: 'doc5',
    fileName: 'attendance_sheet_aug.jpg',
    fileType: 'image/jpeg',
    fileSize: 980000,
    documentType: 'attendance_sheet',
    status: 'rejected',
    uploadedAt: '2026-08-13T14:30:00',
    processedAt: '2026-08-13T14:31:20',
    uploadedBy: 'Admin',
    extractedFields: [],
    rejectionReason: 'Image quality too low — unable to extract data accurately.',
  },
  {
    id: 'doc6',
    fileName: 'vikram_admission.pdf',
    fileType: 'application/pdf',
    fileSize: 275000,
    documentType: 'admission_form',
    status: 'pending_approval',
    uploadedAt: '2026-08-15T10:10:00',
    processedAt: '2026-08-15T10:10:58',
    uploadedBy: 'Admin',
    extractedFields: [
      { key: 'studentName', label: 'Student Name', value: 'Vikram Nair', confidence: 97 },
      { key: 'dateOfBirth', label: 'Date of Birth', value: '19/08/2012', confidence: 91 },
      { key: 'parentName', label: 'Parent Name', value: 'Suresh Nair', confidence: 84, isLowConfidence: true },
      { key: 'phone', label: 'Phone Number', value: '9321098765', confidence: 98 },
      { key: 'address', label: 'Address', value: '23, Ganapathy, Coimbatore', confidence: 87 },
      { key: 'class', label: 'Class', value: 'Grade 8', confidence: 95 },
    ],
  },
];

// ─────────────────────────────────────────────
// ALERTS
// ─────────────────────────────────────────────
export const DEMO_ALERTS: Alert[] = [
  { id:'a1', severity:'critical', type:'timetable_conflict', title:'Timetable Conflict', description:'Mr. Suresh Kumar is double-booked on Monday at 09:30 AM for Grade 10-A and Grade 10-B.', actionLabel:'Resolve Conflict', actionRoute:'/timetable', createdAt:'2026-08-15T07:00:00', resolved:false },
  { id:'a2', severity:'critical', type:'timetable_conflict', title:'Room Double-Booked', description:'Room 204 is assigned to two classes at Wednesday 10:30 AM.', actionLabel:'Fix Schedule', actionRoute:'/timetable', createdAt:'2026-08-15T07:00:00', resolved:false },
  { id:'a3', severity:'warning', type:'low_attendance', title:'Low Attendance Alert', description:'27 students have attendance below 75% this month.', actionLabel:'View Students', actionRoute:'/students', createdAt:'2026-08-15T07:05:00', resolved:false },
  { id:'a4', severity:'warning', type:'teacher_overload', title:'Teacher Overload', description:'3 teachers (Suresh Kumar, Priya Nair, Arun Babu) have workload above 90%.', actionLabel:'View Teachers', actionRoute:'/teachers', createdAt:'2026-08-15T07:05:00', resolved:false },
  { id:'a5', severity:'info', type:'document_pending', title:'Documents Awaiting Approval', description:'4 documents are pending admin approval.', actionLabel:'Review Documents', actionRoute:'/document-ai', createdAt:'2026-08-15T08:00:00', resolved:false },
  { id:'a6', severity:'info', type:'ai_recommendation', title:'AI Recommendation', description:'3 classrooms are underutilized today (below 50% capacity). Consider consolidating classes.', actionLabel:'View Resources', actionRoute:'/resources', createdAt:'2026-08-15T08:30:00', resolved:false },
];

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────
export const DEMO_NOTIFICATIONS: Notification[] = [
  { id:'n1', title:'Timetable Conflict Detected', message:'Critical conflict found: Mr. Suresh Kumar double-booked Monday 09:30', type:'timetable_conflict', severity:'critical', read:false, createdAt:'2026-08-15T07:00:00', actionLabel:'Resolve', actionRoute:'/timetable' },
  { id:'n2', title:'Low Attendance Students', message:'27 students now below 75% attendance threshold', type:'low_attendance', severity:'warning', read:false, createdAt:'2026-08-15T07:05:00', actionLabel:'View', actionRoute:'/students' },
  { id:'n3', title:'Document Processed', message:'Admission form for Rathish Kumar has been extracted with 98% average confidence', type:'document_pending', severity:'info', read:false, createdAt:'2026-08-15T08:30:00', actionLabel:'Review', actionRoute:'/document-ai' },
  { id:'n4', title:'Document Processed', message:'Teacher form for Mohan Krishnan processed — review required', type:'document_pending', severity:'info', read:false, createdAt:'2026-08-15T07:55:00', actionLabel:'Review', actionRoute:'/document-ai' },
  { id:'n5', title:'Teacher Workload Warning', message:'Ms. Priya Nair workload reached 92% — consider redistributing', type:'teacher_overload', severity:'warning', read:true, createdAt:'2026-08-15T07:10:00', actionLabel:'View', actionRoute:'/teachers' },
  { id:'n6', title:'Document Rejected', message:'Attendance sheet rejected due to poor image quality', type:'document_pending', severity:'warning', read:true, createdAt:'2026-08-13T14:35:00', actionLabel:'Re-upload', actionRoute:'/document-ai' },
  { id:'n7', title:'AI Resource Insight', message:'Physics Lab utilization projected to reach 92% next month', type:'ai_recommendation', severity:'info', read:true, createdAt:'2026-08-14T09:00:00', actionLabel:'View', actionRoute:'/resource-prediction' },
  { id:'n8', title:'Room Double-Booked', message:'Room 204 conflict detected Wednesday 10:30 AM', type:'timetable_conflict', severity:'critical', read:true, createdAt:'2026-08-15T07:00:00', actionLabel:'Fix', actionRoute:'/timetable' },
];

// ─────────────────────────────────────────────
// RESOURCE PREDICTIONS
// ─────────────────────────────────────────────
export const DEMO_RESOURCE_PREDICTIONS: ResourcePrediction[] = [
  { id:'rp1', resourceId:'lab1', resourceName:'Physics Lab', resourceType:'Laboratory', currentUtilization:70, predictedUtilization:92, predictionMonth:'September 2026', recommendation:'Move Grade 11 Physics practical sessions to Wednesday afternoon to distribute load', expectedImprovement:14, priority:'high' },
  { id:'rp2', resourceId:'lab4', resourceName:'Computer Lab', resourceType:'Laboratory', currentUtilization:88, predictedUtilization:97, predictionMonth:'September 2026', recommendation:'Schedule Grade 12 CS sessions to Monday morning when utilization is lower', expectedImprovement:12, priority:'high' },
  { id:'rp3', resourceId:'r204', resourceName:'Room 204', resourceType:'Classroom', currentUtilization:95, predictedUtilization:98, predictionMonth:'September 2026', recommendation:'Resolve current double-booking conflict and consider overflow scheduling to Room 301', expectedImprovement:8, priority:'high' },
  { id:'rp4', resourceId:'lab3', resourceName:'Biology Lab', resourceType:'Laboratory', currentUtilization:58, predictedUtilization:62, predictionMonth:'September 2026', recommendation:'Consolidate Grade 9 and Grade 10 Biology practicals on Tuesday/Thursday for better utilization', expectedImprovement:18, priority:'medium' },
  { id:'rp5', resourceId:'hall1', resourceName:'Assembly Hall', resourceType:'Hall', currentUtilization:30, predictedUtilization:35, predictionMonth:'September 2026', recommendation:'Schedule club activities and extracurricular events during off-peak hours to improve utilization', expectedImprovement:25, priority:'low' },
];

// ─────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────
export const DEMO_AUDIT_LOGS: AuditLog[] = [
  { id:'log1', timestamp:'2026-08-15T09:42:00', userId:'admin1', userName:'Admin', action:'APPROVE_DOCUMENT', entity:'Document', entityId:'doc2', details:'Approved transfer certificate for Sneha Ramesh', ipAddress:'192.168.1.100' },
  { id:'log2', timestamp:'2026-08-15T09:15:00', userId:'admin1', userName:'Admin', action:'UPLOAD_DOCUMENT', entity:'Document', entityId:'doc3', details:'Uploaded registration form for Ananya Krishnan', ipAddress:'192.168.1.100' },
  { id:'log3', timestamp:'2026-08-15T08:30:00', userId:'admin1', userName:'Admin', action:'UPLOAD_DOCUMENT', entity:'Document', entityId:'doc1', details:'Uploaded admission form for Rathish Kumar', ipAddress:'192.168.1.100' },
  { id:'log4', timestamp:'2026-08-14T14:30:00', userId:'admin1', userName:'Admin', action:'REJECT_DOCUMENT', entity:'Document', entityId:'doc5', details:'Rejected attendance sheet — poor image quality', ipAddress:'192.168.1.100' },
  { id:'log5', timestamp:'2026-08-14T11:00:00', userId:'admin1', userName:'Admin', action:'UPDATE_STUDENT', entity:'Student', entityId:'s1', details:'Updated contact information for Rathish Kumar', ipAddress:'192.168.1.100' },
  { id:'log6', timestamp:'2026-08-14T10:30:00', userId:'admin1', userName:'Admin', action:'ADD_TEACHER', entity:'Teacher', entityId:'t12', details:'Added new teacher Ms. Radha Gopalan — Mathematics department', ipAddress:'192.168.1.100' },
  { id:'log7', timestamp:'2026-08-13T09:00:00', userId:'admin1', userName:'Admin', action:'GENERATE_TIMETABLE', entity:'Timetable', entityId:'tt-2026', details:'Generated optimized timetable for Academic Year 2025-26', ipAddress:'192.168.1.100' },
  { id:'log8', timestamp:'2026-08-12T15:00:00', userId:'admin1', userName:'Admin', action:'MARK_ATTENDANCE', entity:'Attendance', entityId:'att-batch-12', details:'Batch attendance marked for Grade 10-A (46 students)', ipAddress:'192.168.1.100' },
];
