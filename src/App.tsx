import { useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Docs from '@/pages/Docs';
import { NotFound, ServerError } from '@/pages/Errors';

function AppContent() {
  const { path } = useRouter();
  useEffect(() => { document.title = path.startsWith('/docs') ? 'Documentation — SamApi' : path === '/500' ? 'Server Error — SamApi' : path === '/404' ? 'Not Found — SamApi' : 'SamApi — Simple, powerful APIs'; }, [path]);
  const isError = path === '/404' || path === '/500';
  return <div className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white"><Navbar />{path === '/' ? <Home /> : path === '/docs' || path.startsWith('/docs/') ? <Docs /> : path === '/500' ? <ServerError /> : <NotFound />}{!isError && <Footer />}</div>;
}

function App() { return <ThemeProvider><RouterProvider><AppContent /></RouterProvider></ThemeProvider>; }

export default App;
