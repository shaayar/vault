import { Routes, Route } from 'react-router-dom'
import { LandingScreen } from './components/LandingScreen/LandingScreen'
import { AppLayout } from './components/AppLayout/AppLayout'
import { NotFound } from './components/NotFound/NotFound'
import { ProtectedRoute } from './components/ProtectedRoute'

/**
 * VaultNote root with routing for vault and note navigation.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingScreen />} />
      <Route path="/:vaultName" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
      <Route path="/:vaultName/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App

// What would i like to do today?

// The course from Hugging Face on AI Agents
// explore some ways to dual boot Arch/Windows with Ubuntu