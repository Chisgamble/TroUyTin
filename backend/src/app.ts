import express from "express";
import cors from "cors";
import profileRoutes from "./routes/profile.routes";
import roomRoutes from "./routes/room.routes";
import reviewRoutes from "./routes/review.routes";
import searchRoutes from "./routes/search.routes";

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
app.use("/api/reviews", reviewRoutes);
app.use("/api/search", searchRoutes);

export default app;