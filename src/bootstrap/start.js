import app from "src/app";
// Start server
app.server.listen(process.env.PORT);
console.log(`Server started on port: ${process.env.PORT}`);