# StudyZone - Learning Management System

A comprehensive Learning Management System (LMS) built with modern web technologies, designed to facilitate online education and course management.

## 👥 Team Information

**Team Name:** DreamCoders

**Team Members:**
- **Team Leader:** M. Parasuram
- **Participant 1:** G. Deekshitha
- **Participant 2:** Junaid Hussain
- **Participant 3:** Nagavali

## 🚀 Live Demo

**Frontend:** [https://studyzone-juixbbe2a-parasuramgoud30-1909s-projects.vercel.app](https://studyzone-juixbbe2a-parasuramgoud30-1909s-projects.vercel.app)

## 📋 Features

### For Students
- **Course Enrollment**: Browse and enroll in available courses
- **Assignment Submission**: Submit assignments with file uploads
- **Grade Tracking**: View assignment grades and feedback
- **Discussion Forums**: Participate in course discussions
- **Material Access**: Download course materials and resources
- **Profile Management**: Update personal information and settings

### For Teachers
- **Course Creation**: Create and manage courses with detailed descriptions
- **Assignment Management**: Create assignments with due dates and grading rubrics
- **Grade Management**: Review submissions and assign grades with feedback
- **Material Upload**: Share course materials, lectures, and resources
- **Discussion Moderation**: Manage course discussions and announcements
- **Student Progress**: Track student enrollment and performance

### General Features
- **User Authentication**: Secure login/registration system
- **Role-based Access**: Different dashboards for students and teachers
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Notifications**: Stay updated with course activities
- **File Upload System**: Support for various file types (PDF, DOC, images, etc.)

## 🛠️ Tech Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with responsive design
- **JavaScript (ES6+)**: Interactive functionality and API integration
- **Font Awesome**: Icons and visual elements

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for data storage
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing

### Deployment
- **Vercel**: Frontend hosting and deployment
- **GitHub**: Version control and repository

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Parasuram2530/Synapse2k25.git
   cd Synapse2k25
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

4. **Start the backend server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

5. **Open the frontend**
   Open `frontend/index.html` in your web browser or serve it with a local server.

### Development

- **Frontend**: Open HTML files directly in browser or use a local server
- **Backend**: Runs on `http://localhost:5000` by default
- **Database**: Ensure MongoDB is running and accessible

## 📁 Project Structure

```
StudyZone/
├── backend/                 # Backend API server
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Custom middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── uploads/            # File upload directory
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # Frontend static files
│   ├── *.html             # HTML pages
│   ├── *.css              # Stylesheets
│   ├── *.js               # JavaScript files
│   └── styles.css         # Main stylesheet
├── .gitignore             # Git ignore rules
└── README.md              # Project documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course (Teacher)
- `GET /api/courses/:id` - Get course details

### Assignments
- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Create assignment (Teacher)
- `POST /api/assignments/:id/submit` - Submit assignment (Student)

### And more...

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Token-based authentication system
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Restricted file types and size limits
- **CORS Protection**: Configured cross-origin policies

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- Desktop computers
- Tablets
- Mobile phones

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Parasuram** - [GitHub](https://github.com/Parasuram2530)

## 🙏 Acknowledgments

- Font Awesome for icons
- MongoDB for database
- Vercel for hosting
- Express.js community
- All contributors and users

---

**StudyZone** - Empowering Education Through Technology 🎓
