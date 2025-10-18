const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
require('dotenv').config();

const sampleTeachers = [
  {
    name: 'Golla Deekshitha',
    email: 'parasuramgoud30@gmail.com',
    password: '123456789',
    role: 'Teacher'
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    password: 'password123',
    role: 'Teacher'
  },
  {
    name: 'Prof. Michael Chen',
    email: 'michael.chen@university.edu',
    password: 'password123',
    role: 'Teacher'
  },
  {
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@university.edu',
    password: 'password123',
    role: 'Teacher'
  },
  {
    name: 'Prof. David Thompson',
    email: 'david.thompson@university.edu',
    password: 'password123',
    role: 'Teacher'
  },
  {
    name: 'Dr. Lisa Park',
    email: 'lisa.park@university.edu',
    password: 'password123',
    role: 'Teacher'
  }
];

const sampleStudents = [
  {
    name: 'Alice Johnson',
    email: 'alice.johnson@student.edu',
    password: 'password123',
    role: 'Student'
  },
  {
    name: 'Bob Smith',
    email: 'bob.smith@student.edu',
    password: 'password123',
    role: 'Student'
  },
  {
    name: 'Carol Davis',
    email: 'carol.davis@student.edu',
    password: 'password123',
    role: 'Student'
  },
  {
    name: 'David Wilson',
    email: 'david.wilson@student.edu',
    password: 'password123',
    role: 'Student'
  },
  {
    name: 'Eva Brown',
    email: 'eva.brown@student.edu',
    password: 'password123',
    role: 'Student'
  }
];

const sampleCourses = [
  {
    title: 'Introduction to Computer Science',
    description: 'Learn the fundamentals of programming, algorithms, and computer systems. This course covers basic concepts in computer science including problem-solving techniques, data structures, and programming paradigms.',
    duration: '12 weeks'
  },
  {
    title: 'Web Development Fundamentals',
    description: 'Master the basics of HTML, CSS, and JavaScript. Build responsive websites and learn modern web development practices including version control and deployment.',
    duration: '10 weeks'
  },
  {
    title: 'Data Structures and Algorithms',
    description: 'Deep dive into essential data structures and algorithmic techniques. Learn to analyze algorithm efficiency and implement solutions for complex computational problems.',
    duration: '14 weeks'
  },
  {
    title: 'Database Design and Management',
    description: 'Learn database design principles, SQL, and NoSQL databases. Understand normalization, indexing, and query optimization for efficient data management.',
    duration: '11 weeks'
  },
  {
    title: 'Machine Learning Basics',
    description: 'Introduction to machine learning concepts including supervised and unsupervised learning, neural networks, and practical applications using Python.',
    duration: '16 weeks'
  },
  {
    title: 'Cybersecurity Fundamentals',
    description: 'Understand cybersecurity principles, threats, and defense strategies. Learn about encryption, network security, and ethical hacking techniques.',
    duration: '13 weeks'
  },
  {
    title: 'Mobile App Development',
    description: 'Build native mobile applications for iOS and Android. Learn React Native, Flutter, and cross-platform development best practices.',
    duration: '15 weeks'
  },
  {
    title: 'Cloud Computing and AWS',
    description: 'Master cloud computing concepts and AWS services. Learn to deploy, manage, and scale applications in the cloud environment.',
    duration: '12 weeks'
  },
  {
    title: 'Software Engineering Principles',
    description: 'Learn software development methodologies, testing strategies, and project management. Understand the complete software development lifecycle.',
    duration: '14 weeks'
  },
  {
    title: 'Artificial Intelligence Ethics',
    description: 'Explore the ethical implications of AI development and deployment. Discuss bias, privacy, and responsible AI practices in modern society.',
    duration: '8 weeks'
  }
];

const sampleAssignments = [
  {
    title: 'Programming Fundamentals Quiz',
    description: 'Complete the quiz on basic programming concepts including variables, loops, and functions.',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    maxPoints: 100
  },
  {
    title: 'HTML/CSS Project',
    description: 'Create a responsive webpage using HTML and CSS. Include navigation, forms, and proper semantic markup.',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    maxPoints: 150
  },
  {
    title: 'Algorithm Analysis Assignment',
    description: 'Analyze the time and space complexity of different sorting algorithms and implement them in your preferred programming language.',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    maxPoints: 200
  },
  {
    title: 'Database Design Project',
    description: 'Design a normalized database schema for a library management system. Include ER diagrams and SQL scripts.',
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    maxPoints: 250
  },
  {
    title: 'Machine Learning Model',
    description: 'Implement a simple machine learning model using Python and scikit-learn. Train and evaluate the model on a dataset.',
    dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
    maxPoints: 300
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/userauth');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    console.log('Cleared existing data');

    // Create teachers
    const teachers = [];
    for (const teacherData of sampleTeachers) {
      const teacher = await User.create(teacherData);
      teachers.push(teacher);
      console.log(`Created teacher: ${teacher.name}`);
    }

    // Create students
    const students = [];
    for (const studentData of sampleStudents) {
      const student = await User.create(studentData);
      students.push(student);
      console.log(`Created student: ${student.name}`);
    }

    // Create courses - assign first 5 courses to Golla Deekshitha, distribute rest among other teachers
    const courses = [];
    for (let i = 0; i < sampleCourses.length; i++) {
      const courseData = sampleCourses[i];
      let teacher;

      if (i < 5) {
        // First 5 courses go to Golla Deekshitha
        teacher = teachers[0];
      } else {
        // Remaining courses distributed among other teachers
        teacher = teachers[(i % (teachers.length - 1)) + 1];
      }

      const course = await Course.create({
        ...courseData,
        teacher: teacher._id,
        enrolledStudents: students.slice(0, Math.floor(Math.random() * students.length) + 1).map(s => s._id) // Random enrollment
      });
      courses.push(course);
      console.log(`Created course: ${course.title} by ${teacher.name}`);
    }

    // Create assignments for courses
    const assignments = [];
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const numAssignments = Math.floor(Math.random() * 3) + 1; // 1-3 assignments per course

      for (let j = 0; j < numAssignments; j++) {
        const assignmentData = sampleAssignments[j % sampleAssignments.length];
        const assignment = await Assignment.create({
          ...assignmentData,
          course: course._id,
          teacher: course.teacher
        });
        assignments.push(assignment);
        console.log(`Created assignment: ${assignment.title} for course: ${course.title}`);
      }
    }

    // Create submissions for assignments
    for (const assignment of assignments) {
      const course = await Course.findById(assignment.course).populate('enrolledStudents');
      const enrolledStudents = course.enrolledStudents;

      // Some students submit, some don't
      const submittingStudents = enrolledStudents.filter(() => Math.random() > 0.3); // 70% submission rate

      for (const student of submittingStudents) {
        const submissionContent = `This is my submission for ${assignment.title}. I have completed the assignment requirements and believe I have addressed all the key points mentioned in the assignment description.`;

        const submission = await Submission.create({
          assignment: assignment._id,
          student: student._id,
          course: course._id,
          content: submissionContent,
          submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random submission time within last week
        });

        console.log(`Created submission by ${student.name} for assignment: ${assignment.title}`);
      }
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`Created ${teachers.length} teachers, ${students.length} students, ${courses.length} courses, ${assignments.length} assignments, and multiple submissions`);

    // Display summary
    const finalTeachers = await User.find({ role: 'Teacher' }).select('name email');
    const finalStudents = await User.find({ role: 'Student' }).select('name email');
    const finalCourses = await Course.find().populate('teacher', 'name').select('title teacher');
    const finalAssignments = await Assignment.find().populate('course', 'title').select('title course');
    const finalSubmissions = await Submission.find().populate('student', 'name').populate('assignment', 'title');

    console.log('\n👨‍🏫 Teachers:');
    finalTeachers.forEach(teacher => console.log(`- ${teacher.name} (${teacher.email})`));

    console.log('\n👨‍🎓 Students:');
    finalStudents.forEach(student => console.log(`- ${student.name} (${student.email})`));

    console.log('\n📚 Courses:');
    finalCourses.forEach(course => console.log(`- "${course.title}" by ${course.teacher.name}`));

    console.log('\n📝 Assignments:');
    finalAssignments.forEach(assignment => console.log(`- "${assignment.title}" in "${assignment.course.title}"`));

    console.log('\n📤 Submissions:');
    console.log(`Total submissions: ${finalSubmissions.length}`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedDatabase();