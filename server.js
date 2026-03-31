// Server entry point
require("dotenv").config();
const app = require("./src/app");

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});