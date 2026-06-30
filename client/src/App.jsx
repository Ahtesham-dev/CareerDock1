import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PageTransition from './layout/PageTransition';
import Sidebar from './layout/Sidebar';
import TopNav from './layout/TopNav';
import MobileNav from './layout/MobileNav';
import BrandBar from './components/BrandBar';
import LoadingScreen from './components/LoadingScreen';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import FounderStory from './pages/FounderStory';
import Dashboard from './pages/Dashboard';
import MissionControlDashboard from './pages/MissionControlDashboard';
import SavedJobs from './pages/SavedJobs';
import Applications from './pages/Applications';
import Insights from './pages/Insights';
import Alerts from './pages/Alerts';
import Search from './pages/Search';
import Profile from './pages/Profile';

const ALL_SOURCES = ['LinkedIn', 'Naukri', 'JSearch', 'Internshala', 'Career Pages', 'Wellfound', 'GitHub', 'HackerNews', 'Dev.to', 'YCombinator', 'Peerlist', 'Instahyre', 'Cutshort', 'Hirect'];

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeSources, setActiveSources] = useState(ALL_SOURCES);
  const location = useLocation();

  const toggleSource = (source) => {
    setActiveSources(prev =>
      prev.length === 1 && prev[0] === source ? ALL_SOURCES : [source]
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar
          activeSources={activeSources}
          toggleSource={toggleSource}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/dashboard" element={<PageTransition><Dashboard activeSources={activeSources} /></PageTransition>} />
              <Route path="/command-center" element={<PageTransition><MissionControlDashboard /></PageTransition>} />
              <Route path="/saved" element={<PageTransition><SavedJobs /></PageTransition>} />
              <Route path="/applications" element={<PageTransition><Applications /></PageTransition>} />
              <Route path="/insights" element={<PageTransition><Insights /></PageTransition>} />
              <Route path="/alerts" element={<PageTransition><Alerts /></PageTransition>} />
              <Route path="/search" element={<PageTransition><Search /></PageTransition>} />
              <Route path="/settings" element={<PageTransition><Profile /></PageTransition>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
        <MobileNav />
      </div>
      <BrandBar />
    </div>
  );
}

function App() {
  const [loadingDone, setLoadingDone] = useState(false);

  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AnimatePresence>
            {!loadingDone && <LoadingScreen onComplete={() => setLoadingDone(true)} />}
          </AnimatePresence>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/crafted-by-ahtesham" element={<FounderStory />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
