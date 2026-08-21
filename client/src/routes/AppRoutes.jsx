import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { VeloopLoader } from '../components/common/VeloopLoader/VeloopLoader';

const Home = lazy(() => import('../pages/Home/Home'));
const GiveawayDetails = lazy(() => import('../pages/GiveawayDetails/GiveawayDetails'));
const Login = lazy(() => import('../pages/Login/Login'));
const Register = lazy(() => import('../pages/Register/Register'));
const MyParticipations = lazy(() => import('../pages/MyParticipations/MyParticipations'));
const NotFound = lazy(() => import('../pages/NotFound/NotFound'));

export function AppRoutes() {
  return (
    <Suspense fallback={<VeloopLoader />}>
      <Routes>
        {/* Auth pages render full-bleed, without the navbar/footer chrome */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/giveaway/:slug" element={<GiveawayDetails />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/my-participations" element={<MyParticipations />} />
          </Route>

          {/* Phase 2+: admin routes go here behind <ProtectedRoute requireRole="admin" /> */}

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
