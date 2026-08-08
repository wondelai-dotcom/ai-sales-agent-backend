import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, () => {
   
  console.log(`AI Sales Agent Pro API in ascolto sulla porta ${env.port} (${env.nodeEnv})`);
});
