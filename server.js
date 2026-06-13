const env = require('./src/config/env');
const app = require('./src/app');

env.validateEnv();

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
