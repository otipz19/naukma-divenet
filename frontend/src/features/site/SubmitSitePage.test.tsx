import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import { wrapLongitude } from "./submitSchema";

const origin = window.location.origin;
const sitesUrl = `${origin}/api/v1/sites`;
const mineUrl = `${origin}/api/v1/sites/mine`;
const problem = (status: number, errors: unknown[] = []) =>
  HttpResponse.json(
    { status, errors },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 1000 });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, value: 600 });
});

function reference() {
  server.use(
    http.get(`${origin}/api/v1/countries`, () =>
      HttpResponse.json([
        { code: "EG", name: "Egypt", regions: [{ code: "eg-dahab", name: "Dahab" }] },
      ]),
    ),
    http.get(`${origin}/api/v1/gear-items`, () =>
      HttpResponse.json([
        { code: "torch", name: "Torch" },
        { code: "smb", name: "SMB" },
      ]),
    ),
  );
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("option", { name: "Egypt" });
  await user.type(screen.getByLabelText("Site name"), "New Reef");
  await user.type(screen.getByLabelText("Latitude"), "28.5");
  await user.type(screen.getByLabelText("Longitude"), "34.5");
  await user.selectOptions(screen.getByLabelText("Country"), "EG");
  await user.selectOptions(screen.getByLabelText("Region"), "eg-dahab");
  await user.type(screen.getByLabelText("Min depth (m)"), "5");
  await user.type(screen.getByLabelText("Max depth (m)"), "20");
  await user.selectOptions(screen.getByLabelText("Difficulty"), "3");
  await user.type(screen.getByLabelText("Description"), "A reef.");
}

const send = () => screen.getByRole("button", { name: "Submit for review" });

describe("site/submission: The submission page needs a signed-in user", () => {
  it("returns to the page after logging in", async () => {
    renderRoute("/sites/new");
    const user = userEvent.setup();
    server.use(
      http.post(`${origin}/api/v1/auth/login`, () =>
        HttpResponse.json({
          accessToken: "t",
          tokenType: "Bearer",
          expiresIn: 900,
          user: { id: 7, email: "a@b.c", displayName: "Mira", role: "USER" },
        }),
      ),
    );

    await user.type(await screen.findByLabelText("Email"), "a@b.c");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Submit a dive site" })).toBeInTheDocument();
  });

  it("is linked from the map", async () => {
    renderRoute("/");

    expect(await screen.findByRole("link", { name: "Submit a site" })).toHaveAttribute(
      "href",
      "/sites/new",
    );
  });
});

describe("site/submission: The submission page sends a site", () => {
  it("sets the location from a map click", async () => {
    reference();
    startSignedIn();
    renderRoute("/sites/new");
    await screen.findByRole("heading", { name: "Submit a dive site" });
    const map = await waitFor(() => {
      const element = document.querySelector<HTMLElement>(".leaflet-container");
      expect(element).not.toBeNull();
      return element!;
    });

    fireEvent.click(map, { clientX: 500, clientY: 300 });

    await waitFor(() => expect(screen.getByLabelText("Latitude")).not.toHaveValue(""));
    expect(
      Math.abs(Number(screen.getByLabelText<HTMLInputElement>("Latitude").value)),
    ).toBeLessThanOrEqual(90);
    expect(
      Math.abs(Number(screen.getByLabelText<HTMLInputElement>("Longitude").value)),
    ).toBeLessThanOrEqual(180);
  });

  it("wraps a longitude from a copy of the world", () => {
    expect(wrapLongitude(190)).toBeCloseTo(-170);
    expect(wrapLongitude(-190)).toBeCloseTo(170);
    expect(wrapLongitude(34.5)).toBeCloseTo(34.5);
  });

  it("shows field errors for an empty form and sends nothing", async () => {
    let sent = false;
    server.use(
      http.post(sitesUrl, () => {
        sent = true;
        return problem(500);
      }),
    );
    startSignedIn();
    renderRoute("/sites/new");
    await screen.findByRole("heading", { name: "Submit a dive site" });

    await userEvent.click(send());

    expect(await screen.findByText("Enter the site's name.")).toBeInTheDocument();
    expect(screen.getByText("Write a short description.")).toBeInTheDocument();
    expect(sent).toBe(false);
  });

  it("refuses depths in the wrong order", async () => {
    reference();
    startSignedIn();
    renderRoute("/sites/new");
    const user = userEvent.setup();
    await fillForm(user);
    await user.clear(screen.getByLabelText("Min depth (m)"));
    await user.type(screen.getByLabelText("Min depth (m)"), "30");

    await user.click(send());

    expect(await screen.findByText("Must not be above the maximum depth.")).toBeInTheDocument();
  });

  it("sends the values, clears the form and lists the site as pending", async () => {
    reference();
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.post(sitesUrl, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({}, { status: 201 });
      }),
      http.get(mineUrl, () =>
        HttpResponse.json(sent ? [{ id: 9, name: "New Reef", status: "PENDING" }] : []),
      ),
    );
    startSignedIn();
    renderRoute("/sites/new");
    const user = userEvent.setup();
    await fillForm(user);
    const torch = await screen.findAllByRole("button", { name: "Torch" });

    await user.click(torch[0]!);
    await user.click(send());

    expect(await screen.findByText(/has been sent for review/)).toBeInTheDocument();
    expect(sent).toEqual({
      name: "New Reef",
      regionCode: "eg-dahab",
      lat: 28.5,
      lng: 34.5,
      difficulty: 3,
      minDepth: 5,
      maxDepth: 20,
      description: "A reef.",
      requiredGear: ["torch"],
      recommendedGear: [],
    });
    expect(screen.getByLabelText("Site name")).toHaveValue("");
    const link = await screen.findByRole("link", { name: "New Reef" });
    expect(link).toHaveAttribute("href", "/sites/9");
    expect(within(link.parentElement!).getByText("Pending")).toBeInTheDocument();
  });

  it("moves a gear item between required and recommended", async () => {
    reference();
    startSignedIn();
    renderRoute("/sites/new");
    const [required, recommended] = await screen.findAllByRole("button", { name: "Torch" });

    await userEvent.click(required!);
    await userEvent.click(recommended!);

    expect(required).toHaveAttribute("aria-pressed", "false");
    expect(recommended).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a server field error at the field", async () => {
    reference();
    server.use(
      http.post(sitesUrl, () => problem(400, [{ field: "regionCode", message: "unknown region" }])),
    );
    startSignedIn();
    renderRoute("/sites/new");
    const user = userEvent.setup();
    await fillForm(user);

    await user.click(send());

    expect(await screen.findByText("The server refused this value.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an alert for a field the form has no input for", async () => {
    reference();
    server.use(
      http.post(sitesUrl, () => problem(400, [{ field: "requiredGear", message: "unknown" }])),
    );
    startSignedIn();
    renderRoute("/sites/new");
    const user = userEvent.setup();
    await fillForm(user);

    await user.click(send());

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be sent");
  });
});

describe("site/submission: The submission page lists the user's submissions", () => {
  it("shows statuses and the rejection reason", async () => {
    server.use(
      http.get(mineUrl, () =>
        HttpResponse.json([
          { id: 1, name: "Waiting", status: "PENDING" },
          { id: 2, name: "Refused", status: "REJECTED", rejectionReason: "Duplicate of Canyon" },
        ]),
      ),
    );
    startSignedIn();
    renderRoute("/sites/new");

    expect(await screen.findByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText("Duplicate of Canyon")).toBeInTheDocument();
  });
});
