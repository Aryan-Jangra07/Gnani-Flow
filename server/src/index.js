import { config } from './config.js';
import { createApp } from './app.js';

createApp().listen(config.port, () => {
  console.log(`server running on http://localhost:${config.port}`);
  if (!config.gnaniKey) console.log('- GNANI_API_KEY not set, voice input and reply will not work');
  if (!config.google.clientId) console.log('- GOOGLE_CLIENT_ID not set, Google login will not work');
});
