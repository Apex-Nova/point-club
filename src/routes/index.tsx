import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/components/layout/RootLayout';
import Home from '@/pages/Home';
import About from '@/pages/About';
import NotFound from '@/pages/NotFound';
import DrawPage from '@/pages/Draw';
import LoginPage from '@/pages/Login';
import SignupPage from '@/pages/Signup';
import DashboardPage from '@/pages/Dashboard';
import RoomPage from '@/pages/Room';
import ProfilePage from '@/pages/Profile';
import DiscoverPage from '@/pages/Discover';
import MessagesPage from '@/pages/Messages';
import EditProfilePage from '@/pages/Settings/Profile';
import GamesPage from '@/pages/Games';
import WorldPage from '@/pages/World';
import ChallengesPage from '@/pages/Challenges';
import PricingPage from '@/pages/Pricing';
import MarketplacePage from '@/pages/Marketplace';
import CommunitiesPage from '@/pages/Communities';
import AdminPage from '@/pages/Admin';
import AnalyticsPage from '@/pages/Analytics';
import SubscriptionPage from '@/pages/Subscription';
import LearnPage from '@/pages/Learn';
import WorkspacePage from '@/pages/Workspace';
import ApiDocsPage from '@/pages/ApiDocs';
import ReferralPage from '@/pages/Referral';
import EventsPage from '@/pages/Events';
import AutomationPage from '@/pages/Automation';
import SecurityPage from '@/pages/Security';
import FutureAIPage from '@/pages/FutureAI';
import AmbassadorPage from '@/pages/Ambassador';
import AuthGuard from '@/components/auth/AuthGuard';

export const router = createBrowserRouter([
  // Drawing canvas (solo)
  { path: '/draw/:drawingId?', element: <DrawPage /> },

  // Multiplayer room
  { path: '/room/:roomId', element: <RoomPage /> },

  // Auth pages
  { path: '/login',  element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },

  // Protected dashboard
  { path: '/dashboard', element: <AuthGuard><DashboardPage /></AuthGuard> },

  // Phase 5 — Social
  { path: '/profile/:username', element: <ProfilePage /> },
  { path: '/discover',          element: <DiscoverPage /> },
  { path: '/messages',          element: <AuthGuard><MessagesPage /></AuthGuard> },
  { path: '/settings/profile',  element: <AuthGuard><EditProfilePage /></AuthGuard> },

  // Phase 6 — Games, World, Challenges
  { path: '/games',      element: <GamesPage /> },
  { path: '/world',      element: <WorldPage /> },
  { path: '/challenges', element: <ChallengesPage /> },

  // Phase 7 — Monetization, Creator Economy, Communities, Admin
  { path: '/pricing',      element: <PricingPage /> },
  { path: '/marketplace',  element: <MarketplacePage /> },
  { path: '/communities',  element: <CommunitiesPage /> },
  { path: '/admin',        element: <AuthGuard><AdminPage /></AuthGuard> },
  { path: '/analytics',    element: <AuthGuard><AnalyticsPage /></AuthGuard> },
  { path: '/subscription', element: <AuthGuard><SubscriptionPage /></AuthGuard> },

  // Phase 8 — AI Agents, Workspaces, Learning, Developer, Referral
  { path: '/learn',        element: <LearnPage /> },
  { path: '/workspace',    element: <AuthGuard><WorkspacePage /></AuthGuard> },
  { path: '/api-docs',     element: <ApiDocsPage /> },
  { path: '/referral',     element: <ReferralPage /> },

  // Phase 8 — New pages
  { path: '/events',      element: <EventsPage /> },
  { path: '/automation',  element: <AuthGuard><AutomationPage /></AuthGuard> },
  { path: '/security',    element: <AuthGuard><SecurityPage /></AuthGuard> },
  { path: '/future-ai',   element: <FutureAIPage /> },
  { path: '/ambassador',  element: <AmbassadorPage /> },

  // Landing — standalone (full-screen slideshow, no footer)
  { path: '/', element: <Home /> },

  // Public pages with standard layout
  {
    element: <RootLayout />,
    children: [
      { path: 'about', element: <About /> },
      { path: '*',     element: <NotFound /> },
    ],
  },
]);
