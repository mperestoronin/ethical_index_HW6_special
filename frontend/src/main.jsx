import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ChakraProvider
    toastOptions={{ defaultOptions: { position: "bottom-right" } }}
  >
    <App />
  </ChakraProvider>
);
