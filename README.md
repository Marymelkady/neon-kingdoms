# Neon Kingdoms

A room-code party game where players spot a planted bluff, identify a country, answer country trivia, and take their custom fighter into an arcade duel.

## Run it

Requires Node.js 18 or newer. In this folder, run either:

```sh
npm start
```

Or run `node server.js` directly.

Open `http://localhost:3000` on the host computer. Other players on the same Wi-Fi can join using the host computer's local network address and the room code. The host firewall may need to allow incoming connections on port 3000.

Room state lives in server memory and clears when the server restarts. No account or third-party service is required.
