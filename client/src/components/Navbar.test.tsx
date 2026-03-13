import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Navbar from "./Navbar";
import { AuthContext } from "../context/AuthContext";

it("shows login and register links for guests", () => {
  render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          login: async () => undefined,
          register: async () => undefined,
          logout: () => undefined,
        }}
      >
        <Navbar />
      </AuthContext.Provider>
    </MemoryRouter>,
  );

  expect(screen.getByText("Civic Connect")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
});
