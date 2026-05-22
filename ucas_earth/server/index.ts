import 'dotenv/config';
import express from 'express';
import layersRouter from './routes/layers.js';

const app = express();
const PORT = process.env.PORT || 9999;

app.use(express.json({ limit: '100mb' }));

app.use('/api/geojson-layers', layersRouter);

app.listen(PORT, "127.0.0.1", () => {
  console.log(`GeoJSON API server running on http://127.0.0.1:${PORT}`);
});
