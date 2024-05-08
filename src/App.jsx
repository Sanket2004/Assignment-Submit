import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import SignUp from "./Pages/Signup"
import { useContext } from "react";
import { AuthContext } from "./Context/AuthContext";
import HomePage from './Pages/HomePage'
import LoginPage from './Pages/LoginPage'
import AddAssignmentPage from "./Pages/AddAssignmentPage";
import AssignmentDetailsPage from "./Pages/AssignmentDetailsPage"; // Import AssignmentDetailsPage component
import ProfilePage from "./Pages/ProfilePage";
import ErrorPage from "./Pages/ErrorPage";

function App() {
  const { currentUser } = useContext(AuthContext);

  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }

    return children;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/addAssignment" element={
          <ProtectedRoute>
            <AddAssignmentPage />
          </ProtectedRoute>
        } />
        <Route path="/assignment/:id" element={
          <ProtectedRoute>
            <AssignmentDetailsPage />
          </ProtectedRoute>
        } /> {/* New route for assignment details */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } /> // Add the profile route
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
