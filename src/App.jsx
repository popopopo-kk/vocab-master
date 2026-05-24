import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Home, BookOpen, RotateCcw, User } from 'lucide-react'
import HomePage from './pages/Home'
import StudyPage from './pages/Study'
import ReviewPage from './pages/Review'
import ProfilePage from './pages/Profile'
import OnboardingModal from './components/OnboardingModal'
import { getSettings, saveSettings } from './utils/storage'
// import MistakeBookPage from './pages/MistakeBook' // 错词本入口 — 预留

const NAV_ITEMS = [
  { to: '/', label: '首页', icon: Home },
  { to: '/study', label: '学习', icon: BookOpen },
  { to: '/review', label: '复习', icon: RotateCcw },
  { to: '/profile', label: '我的', icon: User },
]

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings().then((s) => {
      if (!s.onboardingComplete) {
        setShowOnboarding(true)
      }
      setLoading(false)
    })
  }, [])

  const handleOnboardingComplete = async (config) => {
    const existing = await getSettings()
    await saveSettings({ ...existing, ...config })
    setShowOnboarding(false)
  }

  if (loading) return null

  return (
    <BrowserRouter>
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 pb-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background safe-bottom">
          <div className="mx-auto flex max-w-lg items-center justify-around">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-2 text-xs sm:text-sm transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </BrowserRouter>
  )
}

export default App
