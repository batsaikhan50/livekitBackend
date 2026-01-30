const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());

const LIVEKIT_API_KEY = 'my_livekit_devkey';
const LIVEKIT_API_SECRET = 'SPsypD0fbZwJuO4i2A3FLhQV6KEX7xcR';

app.get('/token', (req, res) => {
    const { identity, room } = req.query;

    if (!identity || !room) {
        return res.status(400).json({ error: 'Missing identity or room' });
    }

    const token = jwt.sign(
        {
            iss: LIVEKIT_API_KEY,
            sub: identity,
            name: identity,

            // 🔑 THIS IS THE KEY FIX
            video: {
                room: room,
                roomJoin: true,
                canPublish: true,
                canSubscribe: true,
            },

            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
        },
        LIVEKIT_API_SECRET
    );

    res.json({ token });
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Token server running on http://0.0.0.0:3000');
});
