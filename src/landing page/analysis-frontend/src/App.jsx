import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import AdminDecisionPage from './pages/AdminDecisionPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/decision" element={<AdminDecisionPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
