import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import userRoutes from './routes/userRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(
    '/vendor/chart.js',
    express.static(
        path.join(
            __dirname,
            '../node_modules/chart.js/dist'
        )
    )
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

app.listen(PORT, () => {
    console.log(`Server executing at http://localhost:${PORT}`);
});