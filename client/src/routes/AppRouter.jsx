import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/Home/HomePage.jsx";
import Login from "../pages/Auth/Login.jsx";
import Signup from "../pages/Auth/Signup.jsx";
import ForgotPassword from "../pages/Auth/ForgotPassword.jsx";
import ResetPassword from "../pages/Auth/ResetPassword.jsx";
import VerifyEmail from "../pages/Auth/VerifyEmail.jsx";
import Dashboard from "../pages/Dashboard/Dashboard.jsx";
import ExplorePage from "../pages/Explore/ExplorePage.jsx";
import NoteDetailPage from "../pages/NoteDetail/NoteDetailPage.jsx";
import UploadPage from "../pages/Upload/UploadPage.jsx";
import WalletPage from "../pages/Wallet/WalletPage.jsx";
import PremiumPage from "../pages/Premium/PremiumPage.jsx";
import SavedNotesPage from "../pages/SavedNotes/SavedNotesPage.jsx";
import WishlistPage from "../pages/Wishlist/WishlistPage.jsx";
import DocumentReviewPage from "../pages/DocumentReview/DocumentReviewPage.jsx";
import ProfilePage from "../pages/Profile/ProfilePage.jsx";
import LeaderboardPage from "../pages/Leaderboard/LeaderboardPage.jsx";
import StudyPlannerPage from "../pages/StudyPlanner/StudyPlannerPage.jsx";
import AcademicSetupPage from "../pages/Academic/AcademicSetupPage.jsx";
import AcademicSpacePage from "../pages/Academic/AcademicSpacePage.jsx";
import SubjectDetailPage from "../pages/Academic/SubjectDetailPage.jsx";
import AdminDashboard from "../pages/Admin/AdminDashboard.jsx";
import NotFound from "../pages/NotFound.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/notes/:id" element={<NoteDetailPage />} />
      <Route path="/premium" element={<PremiumPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/saved-notes" element={<SavedNotesPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/document-review" element={<DocumentReviewPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/study-planner" element={<StudyPlannerPage />} />
        <Route path="/academic-setup" element={<AcademicSetupPage />} />
        <Route path="/academic" element={<AcademicSpacePage />} />
        <Route path="/academic/subjects/:subjectId" element={<SubjectDetailPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
