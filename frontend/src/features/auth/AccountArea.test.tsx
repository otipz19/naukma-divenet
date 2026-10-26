import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { getSession } from "../../api/session";
import { startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import { initials } from "./AccountArea";

const logoutUrl = `${window.location.origin}/api/v1/auth/logout`;
const header = () => within(screen.getByRole("banner"));
const accountButton = () => header().findByRole("button", { name: /Mira Koval/ });

describe("shared/app-shell: The header shows the account area", () => {
  it("shows Log in and Sign up when signed out", async () => {
    renderRoute("/");

    expect(await header().findByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(header().getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/register");
  });

  it("shows the initials button when signed in", async () => {
    startSignedIn();
    renderRoute("/");

    const button = await accountButton();
    expect(button).toHaveTextContent("MK");
    expect(header().queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });

  it("opens the account menu, and Escape closes it and returns focus", async () => {
    startSignedIn();
    renderRoute("/");
    const user = userEvent.setup();
    const button = await accountButton();

    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu");
    expect(menu).toHaveTextContent("Mira Koval");
    expect(within(menu).getByRole("menuitem", { name: "Log out" })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("shows the account links in Ukrainian", async () => {
    renderRoute("/", { language: "uk" });

    expect(await header().findByRole("link", { name: "Увійти" })).toBeInTheDocument();
    expect(header().getByRole("link", { name: "Зареєструватися" })).toBeInTheDocument();
  });

  it("shows neither state while the session is being restored", () => {
    renderRoute("/");

    expect(header().queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    expect(header().queryByRole("button", { name: /Account menu/ })).not.toBeInTheDocument();
  });

  it("links to the login page with the current page as the way back", async () => {
    renderRoute("/no-such-page");
    const user = userEvent.setup();

    await user.click(await header().findByRole("link", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });
});

describe("auth: The web app logs the user out", () => {
  it("calls the logout endpoint and shows the signed-out area", async () => {
    let calls = 0;
    server.use(
      http.post(logoutUrl, () => {
        calls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    startSignedIn();
    renderRoute("/");
    const user = userEvent.setup();

    await user.click(await accountButton());
    await user.click(screen.getByRole("menuitem", { name: "Log out" }));

    expect(await header().findByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(header().getByRole("link", { name: "Sign up" })).toBeInTheDocument();
    expect(calls).toBe(1);
    expect(getSession().status).toBe("signedOut");
  });

  it("signs out even when the logout call fails", async () => {
    server.use(http.post(logoutUrl, () => HttpResponse.error()));
    startSignedIn();
    renderRoute("/");
    const user = userEvent.setup();

    await user.click(await accountButton());
    await user.click(screen.getByRole("menuitem", { name: "Log out" }));

    expect(await header().findByRole("link", { name: "Log in" })).toBeInTheDocument();
  });
});

describe("shared/app-shell: Narrow screens use a navigation drawer (account links)", () => {
  const openDrawer = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    return { user, dialog: screen.getByRole("dialog") };
  };

  it("holds Log in and Sign up, and following Log in closes it", async () => {
    renderRoute("/");
    await header().findByRole("link", { name: "Log in" });
    const { user, dialog } = await openDrawer();

    expect(within(dialog).getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/register",
    );
    await user.click(within(dialog).getByRole("link", { name: "Log in" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("logs out from the drawer", async () => {
    server.use(http.post(logoutUrl, () => new HttpResponse(null, { status: 204 })));
    startSignedIn();
    renderRoute("/");
    await accountButton();
    const { user, dialog } = await openDrawer();

    expect(dialog).toHaveTextContent("Mira Koval");
    await user.click(within(dialog).getByRole("button", { name: "Log out" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(getSession().status).toBe("signedOut"));
    const reopened = await openDrawer();
    expect(within(reopened.dialog).getByRole("link", { name: "Log in" })).toBeInTheDocument();
  });
});

describe("initials", () => {
  it("takes the first letters of the first two words", () => {
    expect(initials("Mira Koval")).toBe("MK");
    expect(initials("  олена   іванівна петренко ", "uk")).toBe("ОІ");
    expect(initials("Mira")).toBe("M");
  });
});
