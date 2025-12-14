
import { MathTutor } from './components/MathTutor';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MathFlow
            </h1>
            <div className="text-sm text-gray-400">R&D Preview</div>
        </div>
      </header>
      <main>
        <MathTutor />
      </main>
    </div>
  );
}

export default App;
