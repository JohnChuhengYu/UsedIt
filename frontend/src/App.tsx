import { Routes, Route } from 'react-router-dom'
import PageLayout from './components/PageLayout'
import WordLibrary from './pages/WordLibrary'
import WordDetail from './pages/WordDetail'
import Practice from './pages/Practice'
import PracticeSession from './pages/PracticeSession'
import Progress from './pages/Progress'

export default function App() {
  return (
    <PageLayout>
      <Routes>
        <Route path="/" element={<WordLibrary />} />
        <Route path="/word/:id" element={<WordDetail />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/practice/:id" element={<PracticeSession />} />
        <Route path="/progress" element={<Progress />} />
      </Routes>
    </PageLayout>
  )
}
