import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { bpeRouter } from './server/routes/bpeRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares para JSON e formulários
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Headers de CORS para permitir que outros microserviços e sistemas façam requisições facilmente
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Microserviço BP-e SEFAZ (Modelo 63)',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Rotas da API do Microserviço BP-e
  app.use('/api', bpeRouter);

  // Vite middleware para desenvolvimento / SPA em produção
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BP-e Microservice] Servidor rodando na porta ${PORT} (http://0.0.0.0:${PORT})`);
    console.log(`[BP-e Microservice] Endpoints prontos: /api/bpe/emitir, /api/bpe/cancelar, /api/bpe/status-servico, etc.`);
  });
}

startServer().catch((err) => {
  console.error('[BP-e Microservice] Erro fatal na inicialização do servidor:', err);
  process.exit(1);
});
