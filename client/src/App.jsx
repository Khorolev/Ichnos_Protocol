import { Routes, Route } from 'react-router-dom';

import LandingPage from './components/pages/LandingPage';
import ServicesPage from './components/pages/ServicesPage';
import TeamPage from './components/pages/TeamPage';
import PublicLayout from './components/templates/PublicLayout';

const App = () => (
  <PublicLayout>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/team" element={<TeamPage />} />
    </Routes>
  </PublicLayout>
);

export default App;
