import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AuthGate from './components/AuthGate';
import Layout from './pages/Layout';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import FindMentor from './pages/Student/Mentor/FindMentor';
import Messages from './pages/Messages';
import Home from './pages/Home';
import NewsDetail from './pages/NewsDetail';
import Requests from './pages/Alumni/Requests';
import SavedPostsPage from './pages/SavedPostsPage';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import HelpCentre from './pages/HelpCentre';
import Guidelines from './pages/Guidelines';
import ReportIssue from './pages/ReportIssue';
import PublicProfile from './pages/PublicProfile';
import { SocketProvider } from './context/SocketContext';

// New Advanced Session Routing
import BookSession from './pages/Student/Mentor/BookSession';
import StudentSessions from './pages/Student/Sessions';
import AlumniSessions from './pages/Alumni/Sessions';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminCommandCenter from './pages/Admin/CommandCenter';
import AdminSessions from './pages/Admin/Sessions';
import AdminModeration from './pages/Admin/Moderation';
import AdminAnnouncements from './pages/Admin/Announcements';
import GlobalEvents from './pages/Events/GlobalEvents';
import AdminLayout from './layouts/AdminLayout';
import VerificationRequestPage from './pages/Alumni/VerificationRequest';
import VerificationQueue from './pages/Admin/VerificationQueue';
import AccreditationReports from './pages/Admin/AccreditationReports';
import BulkImport from './pages/Admin/BulkImport';
import SuccessStoriesManager from './pages/Admin/SuccessStoriesManager';
import SuccessStories from './pages/Student/SuccessStories';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AuthGate />} />
            <Route path="/terms"        element={<TermsOfService />} />
            <Route path="/privacy"      element={<PrivacyPolicy />} />
            <Route path="/help"         element={<HelpCentre />} />
            <Route path="/guidelines"   element={<Guidelines />} />
            <Route path="/report-issue" element={<ReportIssue />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/saved-posts" element={<SavedPostsPage />} />
                <Route path="/news/view" element={<NewsDetail />} />
                <Route path="/user/:id" element={<PublicProfile />} />
                
                <Route path="alumni/dashboard" element={<Dashboard />} />
                <Route path="alumni/profile" element={<Profile />} />
                <Route path="alumni/messages" element={<Messages />} />
                <Route path="alumni/requests" element={<Requests />} />
                <Route path="alumni/sessions" element={<AlumniSessions />} />
                <Route path="alumni/verification" element={<VerificationRequestPage />} />
                <Route path="alumni/events" element={<GlobalEvents />} />

                <Route path='student/dashboard' element={<Dashboard />} />
                <Route path="student/profile" element={<Profile />} />
                <Route path="student/messages" element={<Messages />} />
                <Route path='student/mentors' element={<FindMentor />} />
                <Route path='student/mentor/:id' element={<BookSession />} />
                <Route path='student/sessions' element={<StudentSessions />} />
                <Route path='student/events' element={<GlobalEvents />} />
                <Route path='student/stories' element={<SuccessStories />} />
              </Route>

              {/* Admin Panel with Dedicated Sidebar Layout */}
              <Route element={<AdminLayout />}>
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/command-center" element={<AdminCommandCenter />} />
                <Route path="admin/sessions" element={<AdminSessions />} />
                <Route path="admin/moderation" element={<AdminModeration />} />
                <Route path="admin/announcements" element={<AdminAnnouncements />} />
                <Route path="admin/verification" element={<VerificationQueue />} />
                <Route path="admin/reports" element={<AccreditationReports />} />
                <Route path="admin/import" element={<BulkImport />} />
                <Route path="admin/stories" element={<SuccessStoriesManager />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </SocketProvider>
    </ToastProvider>
  );
}

export default App;
