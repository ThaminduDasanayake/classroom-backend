import express from "express";

const app = express();
const port = 8000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Welcome to the backend!");
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});