import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Позже замени на твой фронтенд URL
  credentials: true
}));
app.use(express.json());

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ MongoDB подключена'))
  .catch(err => console.log('❌ MongoDB ошибка:', err));

// Модель пользователя
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model('User', UserSchema);

// 📍 Тестовый роут
app.get('/api/test', (req, res) => {
  res.json({ message: '✅ Бэкенд работает на Railway!' });
});

// 📝 Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Проверяем есть ли пользователь
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);

    // Создаем пользователя
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({
      message: 'Пользователь создан',
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 🔐 Логин
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Пользователь не найден' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Неверный пароль' });
    }

    res.json({
      message: 'Успешный вход',
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Бэкенд запущен на порту ${PORT}`);
});