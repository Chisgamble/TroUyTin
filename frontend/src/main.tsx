import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.css"

// TODO: Uncomment khi tích hợp Supabase auth
// import { AuthProvider } from "./contexts/AuthContext.tsx"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* TODO: Bọc <App /> bằng <AuthProvider> khi tích hợp backend
    <AuthProvider>
      <App />
    </AuthProvider>
    */}
    <App />
  </React.StrictMode>
)