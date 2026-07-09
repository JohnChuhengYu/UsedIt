import { Routes, Route } from 'react-router-dom'
import PageLayout from './components/PageLayout'
import ProtectedRoute from './components/ProtectedRoute'
import WordLibrary from './pages/WordLibrary'
import WordDetail from './pages/WordDetail'
import Practice from './pages/Practice'
import PracticeSession from './pages/PracticeSession'
import Progress from './pages/Progress'
import AuthCallback from './pages/AuthCallback'
import Login from './pages/Login'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <PageLayout>
              <Routes>
                <Route path="/" element={<WordLibrary />} />
                <Route path="/word/:id" element={<WordDetail />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/practice/:id" element={<PracticeSession />} />
                <Route path="/progress" element={<Progress />} />
              </Routes>
            </PageLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
