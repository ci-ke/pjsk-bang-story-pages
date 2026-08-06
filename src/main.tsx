import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// React 18 render() 是异步的，延迟到首次绘制之后移除 preload
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.getElementById('preload')?.remove();
  });
});
