import express from "express";
import { db } from "../db";
import { profiles } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../middlewares/auth";

const router = express.Router();



export default router;