import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"
import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";

const queryClient = new QueryClient();

// TODO: Uncomment khi tích hợp Supabase auth
import { AuthProvider } from "./contexts/AuthContext.tsx"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
)