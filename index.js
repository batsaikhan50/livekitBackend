const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());

const LIVEKIT_API_KEY = 'my_livekit_devkey';
const LIVEKIT_API_SECRET = 'SPsypD0fbZwJuO4i2A3FLhQV6KEX7xcR';


const { EgressClient, EncodedFileType } = require('livekit-server-sdk');

const egressClient = new EgressClient('http://livekit:7880', LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

// Store active recording IDs
const activeRecordings = new Map();

app.post('/start-recording', async (req, res) => {
    const { room } = req.query;
    console.log("room: " + JSON.stringify(room))
    if (!room) return res.status(400).json({ error: 'Room name is required' });

    try {
        const output = {
            file: {
                fileType: 1, // 1 = MP4
                filepath: `/recordings/recording-${room}-${Date.now()}.mp4`,
            },
        };

        const info = await egressClient.startRoomCompositeEgress(
            room,
            output,
            {
                layout: 'grid',
                // ADD THIS LINE BELOW:
                // Use the service name defined in docker-compose
                wsUrl: 'ws://livekit:7880',
            }
        );

        activeRecordings.set(room, info.egressId);
        res.json({ success: true, egressId: info.egressId });
    } catch (e) {
        console.error('Egress Error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/stop-recording', async (req, res) => {
    const { room } = req.query;
    const egressId = activeRecordings.get(room);
    if (!egressId) return res.status(404).json({ error: 'No recording found' });

    try {
        await egressClient.stopEgress(egressId);
        activeRecordings.delete(room);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

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
