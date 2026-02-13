import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Vocabulary from './pages/Vocabulary';
import Training from './pages/Training';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="vocabulary" element={<Vocabulary/>}/>
        <Route path="training" element={<Training/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
