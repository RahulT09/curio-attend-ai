import { useState } from "react";
import LandingPage from "@/components/LandingPage";
import AuthForm from "@/components/AuthForm";
import Navigation from "@/components/Navigation";
import StudentDashboard from "@/components/dashboards/StudentDashboard";

type UserRole = 'student' | 'teacher' | 'parent' | 'admin';
type AppState = 'landing' | 'auth' | 'dashboard';

interface User {
  name: string;
  role: UserRole;
  email: string;
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setAppState('auth');
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedRole(null);
    setAppState('landing');
    setCurrentPage('dashboard');
  };

  const handleBack = () => {
    setAppState('landing');
    setSelectedRole(null);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  // Render based on app state
  if (appState === 'landing') {
    return <LandingPage onRoleSelect={handleRoleSelect} />;
  }

  if (appState === 'auth' && selectedRole) {
    return (
      <AuthForm
        selectedRole={selectedRole}
        onLogin={handleLogin}
        onBack={handleBack}
      />
    );
  }

  if (appState === 'dashboard' && user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation
          userRole={user.role}
          userName={user.name}
          onNavigate={handleNavigate}
          currentPage={currentPage}
          onLogout={handleLogout}
        />
        
        <main className="container mx-auto px-4 py-8">
          {currentPage === 'dashboard' && user.role === 'student' && <StudentDashboard />}
          {currentPage === 'dashboard' && user.role === 'teacher' && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-4">Teacher Dashboard</h2>
              <p className="text-muted-foreground">Coming soon - Manage classes, mark attendance, and track student progress</p>
            </div>
          )}
          {currentPage === 'dashboard' && user.role === 'parent' && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-4">Parent Portal</h2>
              <p className="text-muted-foreground">Coming soon - Monitor your child's progress and school activities</p>
            </div>
          )}
          {currentPage === 'dashboard' && user.role === 'admin' && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
              <p className="text-muted-foreground">Coming soon - Complete institution management and analytics</p>
            </div>
          )}
          
          {currentPage === 'attendance' && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-4">Attendance System</h2>
              <p className="text-muted-foreground">QR code scanning, geo-fencing, and instant notifications - Coming soon!</p>
            </div>
          )}
          
          {currentPage === 'curriculum' && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-4">Curriculum Management</h2>
              <p className="text-muted-foreground">Access lessons, assignments, and learning materials - Coming soon!</p>
            </div>
          )}
          
          {currentPage === 'reports' && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-4">Reports & Analytics</h2>
              <p className="text-muted-foreground">Comprehensive insights and data visualization - Coming soon!</p>
            </div>
          )}
          
          {currentPage === 'ai-analyzer' && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-4">AI Analyzer</h2>
              <p className="text-muted-foreground">Intelligent insights and natural language analytics - Coming soon!</p>
            </div>
          )}
          
          {currentPage === 'chatbot' && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-4">24/7 Chatbot</h2>
              <p className="text-muted-foreground">AI-powered assistant for instant support - Coming soon!</p>
            </div>
          )}
          
          {currentPage === 'settings' && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-4">Settings</h2>
              <p className="text-muted-foreground">Manage your account and preferences - Coming soon!</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
};

export default Index;