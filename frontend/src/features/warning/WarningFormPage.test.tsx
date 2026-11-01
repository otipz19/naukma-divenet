import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { components } from "../../api/schema.gen";
import { authResponse, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import type { Warning } from "./api";

const origin = window.location.origin;
const siteUrl = `${origin}/api/v1/sites/7`;
const createUrl = `${origin}/api/v1/sites/7/warnings`;
const warningUrl = `${origin}/api/v1/warnings/12`;

const problem = (status: number) =>
  HttpResponse.json(
    { status },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );

const site: components["schemas"]["SiteResponse"] = {
  id: 7,
  name: "SS Thistlegorm",
  lat: 27.8,
  lng: 33.9,
  countryCode: "EG",
  regionCode: "eg-dahab",
  difficulty: 2,
  minDepth: 16,
  maxDepth: 32,
  description: "A wreck.",
  requiredGear: [],
  recommendedGear: [],
  ratingCount: 0,
  reviewCount: 0,
  status: "APPROVED",
};

const ownWarning: Warning = {
  id: 12,
  siteId: 7,
  author: { id: 7, displayName: "Mira Koval" },
  type: "HAZARD",
  text: "Strong current on the bow line",
  createdAt: "2026-05-12T10:00:00Z",
  updatedAt: "2026-05-12T10:00:00Z",
};

function serve({
  existing = ownWarning,
  siteStatus = 200,
  warningStatus = 200,
}: {
  existing?: Warning | null;
  siteStatus?: number;
  warningStatus?: number;
} = {}) {
  const writes: { method: string; url: string; body: Record<string, unknown> }[] = [];
  const record = async ({ request }: { request: Request }) => {
    writes.push({
      method: request.method,
      url: request.url,
      body: (await request.json()) as Record<string, unknown>,
    });
    return HttpResponse.json({ ...ownWarning }, { status: request.method === "POST" ? 201 : 200 });
  };
  server.use(
    http.get(siteUrl, () => (siteStatus === 200 ? HttpResponse.json(site) : problem(siteStatus))),
    http.get(`${origin}/api/v1/sites/7/reviews/mine`, () => problem(404)),
    http.get(warningUrl, () =>
      warningStatus === 200 && existing ? HttpResponse.json(existing) : problem(warningStatus),
    ),
    http.post(createUrl, record),
    http.put(warningUrl, record),
  );
  return writes;
}

describe("warning/warning-form: The warning form has a type and a text", () => {
  it("shows an empty form for a new warning", async () => {
    startSignedIn();
    serve();
    renderRoute("/sites/7/warnings/new");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Report a warning" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/SS Thistlegorm · Egypt, Dahab/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Back to SS Thistlegorm" })).toHaveAttribute(
      "href",
      "/sites/7",
    );

    const select = screen.getByLabelText("Warning type");
    expect(select).toHaveValue("");
    const optionTexts = within(select)
      .getAllByRole("option")
      .map((opt) => opt.textContent);
    expect(optionTexts).toEqual([
      "Choose a type…",
      "Hazard",
      "Incident",
      "Changed conditions",
      "Marine life",
    ]);

    expect(screen.getByLabelText("Warning details")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Post warning" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/sites/7");
  });

  it("sends an anonymous visitor to log in, then back to the form", async () => {
    serve();
    server.use(http.post(`${origin}/api/v1/auth/login`, () => HttpResponse.json(authResponse())));
    renderRoute("/sites/7/warnings/new");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Email"), "mira@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Report a warning" }),
    ).toBeInTheDocument();
  });

  it("shows labels, options and buttons in Ukrainian when the language is uk", async () => {
    startSignedIn();
    serve();
    renderRoute("/sites/7/warnings/new", { language: "uk" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Повідомити про небезпеку" }),
    ).toBeInTheDocument();
    const select = screen.getByLabelText("Тип попередження");
    const optionTexts = within(select)
      .getAllByRole("option")
      .map((opt) => opt.textContent);
    expect(optionTexts).toEqual([
      "Виберіть тип…",
      "Небезпека",
      "Інцидент",
      "Зміна умов",
      "Морська фауна",
    ]);
    expect(screen.getByLabelText("Деталі попередження")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Опублікувати попередження" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Скасувати" })).toBeInTheDocument();
  });

  it("shows the site not-found message and a link to / when the site answers 404", async () => {
    startSignedIn();
    serve({ siteStatus: 404 });
    renderRoute("/sites/7/warnings/new");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Site not found" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the map" })).toHaveAttribute("href", "/");
  });

  it("navigates to /sites/7 and sends no request when Cancel is pressed", async () => {
    startSignedIn();
    const writes = serve();
    renderRoute("/sites/7/warnings/new");

    await userEvent.click(await screen.findByRole("link", { name: "Cancel" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "SS Thistlegorm" }),
    ).toBeInTheDocument();
    expect(writes).toHaveLength(0);
  });
});

describe("warning/warning-form: The form posts a warning", () => {
  it("posts the chosen type and text and navigates to /sites/7", async () => {
    startSignedIn();
    const writes = serve();
    renderRoute("/sites/7/warnings/new");
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText("Warning type"), "Changed conditions");
    await user.type(screen.getByLabelText("Warning details"), "Visibility down to 10 m");
    await user.click(screen.getByRole("button", { name: "Post warning" }));

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]!).toEqual({
      method: "POST",
      url: createUrl,
      body: { type: "CHANGED_CONDITIONS", text: "Visibility down to 10 m" },
    });
    expect(
      await screen.findByRole("heading", { level: 1, name: "SS Thistlegorm" }),
    ).toBeInTheDocument();
  });
});

describe("warning/warning-form: The form refuses an incomplete warning", () => {
  it("sends no request and shows a required message on the type field when no type is chosen", async () => {
    startSignedIn();
    const writes = serve();
    renderRoute("/sites/7/warnings/new");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Warning details"), "Strong current");
    await user.click(screen.getByRole("button", { name: "Post warning" }));

    expect(screen.getByText("Choose a warning type.")).toBeInTheDocument();
    expect(screen.getByLabelText("Warning type")).toHaveAttribute("aria-invalid", "true");
    expect(writes).toHaveLength(0);
  });

  it("sends no request and shows a required message on the text field when the text is blank", async () => {
    startSignedIn();
    const writes = serve();
    renderRoute("/sites/7/warnings/new");
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText("Warning type"), "Hazard");
    await user.type(screen.getByLabelText("Warning details"), "   ");
    await user.click(screen.getByRole("button", { name: "Post warning" }));

    expect(screen.getByText("Write the warning details.")).toBeInTheDocument();
    expect(screen.getByLabelText("Warning details")).toHaveAttribute("aria-invalid", "true");
    expect(writes).toHaveLength(0);
  });

  it("shows an error alert and keeps the values entered when the create request answers 400", async () => {
    startSignedIn();
    serve();
    server.use(http.post(createUrl, () => problem(400)));
    renderRoute("/sites/7/warnings/new");
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText("Warning type"), "Incident");
    await user.type(screen.getByLabelText("Warning details"), "Lost anchor");
    await user.click(screen.getByRole("button", { name: "Post warning" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The warning could not be saved.");
    expect(screen.getByLabelText("Warning type")).toHaveValue("INCIDENT");
    expect(screen.getByLabelText("Warning details")).toHaveValue("Lost anchor");
  });
});

describe("warning/warning-form: The same form edits an own warning", () => {
  it("loads the user's warning into the form on /sites/7/warnings/12/edit", async () => {
    startSignedIn();
    serve();
    renderRoute("/sites/7/warnings/12/edit");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Edit warning" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Warning type")).toHaveValue("HAZARD");
    expect(screen.getByLabelText("Warning details")).toHaveValue("Strong current on the bow line");
    expect(screen.getByRole("button", { name: "Save warning" })).toBeInTheDocument();
  });

  it("updates warning 12 and navigates to /sites/7 when saved", async () => {
    startSignedIn();
    const writes = serve();
    renderRoute("/sites/7/warnings/12/edit");
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText("Warning type"), "Incident");
    await user.click(screen.getByRole("button", { name: "Save warning" }));

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]!).toEqual({
      method: "PUT",
      url: warningUrl,
      body: { type: "INCIDENT", text: "Strong current on the bow line" },
    });
    expect(
      await screen.findByRole("heading", { level: 1, name: "SS Thistlegorm" }),
    ).toBeInTheDocument();
  });

  it("shows the warning not-found message and a link to /sites/7 for someone else's warning", async () => {
    startSignedIn();
    serve({
      existing: {
        ...ownWarning,
        author: { id: 21, displayName: "Oleh Kravets" },
      },
    });
    renderRoute("/sites/7/warnings/12/edit");

    expect(
      await screen.findByRole("heading", { level: 1, name: "This warning was not found." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to SS Thistlegorm" })).toHaveAttribute(
      "href",
      "/sites/7",
    );
  });

  it("shows the warning not-found message and a link to /sites/7 when the warning answers 404", async () => {
    startSignedIn();
    serve({ warningStatus: 404 });
    renderRoute("/sites/7/warnings/12/edit");

    expect(
      await screen.findByRole("heading", { level: 1, name: "This warning was not found." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to SS Thistlegorm" })).toHaveAttribute(
      "href",
      "/sites/7",
    );
  });
});
