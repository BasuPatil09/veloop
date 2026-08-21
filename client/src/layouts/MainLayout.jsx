import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar/Navbar';
import { Footer } from '../components/layout/Footer/Footer';

export function MainLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
