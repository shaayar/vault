import { Routes, Route } from 'react-router-dom'
import { LandingScreen } from './components/LandingScreen/LandingScreen'
import { AppLayout } from './components/AppLayout/AppLayout'
import { NotFound } from './components/NotFound/NotFound'

/**
 * VaultNote root with routing for vault and note navigation.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingScreen />} />
      <Route path="/:vaultName" element={<AppLayout />} />
      <Route path="/:vaultName/*" element={<AppLayout />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
