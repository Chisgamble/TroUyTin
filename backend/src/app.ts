import express from "express";
import cors from "cors";
import profileRoutes from "./routes/profile.routes";
import roomRoutes from "./routes/room.routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use("/api/profiles", profileRoutes);
app.use("/api/rooms", roomRoutes);

export default app;