import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Intelligent Iguanas API',
    timestamp: new Date().toISOString(),
  });
});

const LAUNCH_DATE_ISO = '2026-09-04T00:00:00+05:30';

// Public config endpoint
app.get('/api/config', (req, res) => {
  const now = new Date();
  const launchDate = new Date(LAUNCH_DATE_ISO);
  const isLaunched = now >= launchDate;
  const whatsappGroupLink = process.env.WHATSAPP_GROUP_LINK || null;
  
  res.json({
    launchDate: LAUNCH_DATE_ISO,
    isLaunched,
    // WhatsApp group link is protected and only returned after launch date
    whatsappGroupLink: isLaunched ? whatsappGroupLink : null,
    communityName: 'Intelligent Iguanas',
    tagline: 'Learn • Share • Build • Grow',
  });
});

// Serve static files in production
const clientDistPath = join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));
app.get('/{*splat}', (req, res) => {
  const indexPath = join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Frontend not built yet. Run: npm run build' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🦎 Intelligent Iguanas API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Config: http://localhost:${PORT}/api/config`);
});
