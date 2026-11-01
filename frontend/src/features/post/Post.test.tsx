import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { MIRA, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import type { Post, PostSummary } from "./api";

const origin = window.location.origin;
const posts = `${origin}/api/v1/posts`;
const OLEH = { id: 21, displayName: "Oleh Kravets" };

const post = (overrides: Partial<Post> = {}): Post => ({
  id: 5,
  title: "Night dive",
  text: "First paragraph.\n\nSecond paragraph.",
  status: "PUBLISHED",
  readMinutes: 3,
  publishedAt: "2026-05-14T10:00:00Z",
  updatedAt: "2026-05-14T10:00:00Z",
  author: OLEH,
  photos: [],
  ...overrides,
});

const notFound = () =>
  HttpResponse.json(
    { status: 404 },
    { status: 404, headers: { "Content-Type": "application/problem+json" } },
  );

const servePost = (value: Post) =>
  server.use(http.get(`${posts}/${value.id}`, () => HttpResponse.json(value)));

const COUNTRIES = [
  { code: "EG", name: "Egypt", regions: [{ code: "eg-dahab", name: "Dahab" }] },
  { code: "HR", name: "Croatia", regions: [{ code: "hr-istria", name: "Istria" }] },
];

function serveEditorData() {
  server.use(http.get(`${origin}/api/v1/countries`, () => HttpResponse.json(COUNTRIES)));
}

describe("post/pages: The post page shows a post", () => {
  it("shows the post", async () => {
    servePost(
      post({
        regionCode: "eg-dahab",
        countryCode: "EG",
        site: { id: 7, name: "Blue Hole" },
        photos: [{ id: "p", url: "/media/p", thumbnailUrl: "/media/p/thumb", width: 4, height: 3 }],
      }),
    );
    renderRoute("/posts/5");

    expect(await screen.findByRole("heading", { name: "Night dive" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Oleh Kravets" })).toHaveAttribute("href", "/users/21");
    expect(screen.getByText(/14 May 2026 · 3 min read/)).toBeInTheDocument();
    expect(screen.getByText("Dahab")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Blue Hole" })).toHaveAttribute("href", "/sites/7");
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Night dive/ })).toHaveAttribute("src", "/media/p");
  });

  it("names the region in the active language", async () => {
    servePost(post({ regionCode: "eg-dahab" }));
    renderRoute("/posts/5", { language: "uk" });

    expect(await screen.findByText("Дахаб")).toBeInTheDocument();
  });

  it("shows markup as text", async () => {
    servePost(post({ text: "<b>Bold</b>" }));
    const { container } = renderRoute("/posts/5");

    expect(await screen.findByText("<b>Bold</b>")).toBeInTheDocument();
    expect(container.querySelector("main b")).toBeNull();
  });

  it("shows a not-found message", async () => {
    server.use(http.get(`${posts}/5`, notFound));
    renderRoute("/posts/5");

    expect(await screen.findByRole("heading", { name: "Post not found" })).toBeInTheDocument();
  });
});

describe("post/pages: The author reaches the editor from the post page", () => {
  it("shows the author an Edit link", async () => {
    startSignedIn();
    servePost(post({ author: { id: MIRA.id, displayName: MIRA.displayName } }));
    renderRoute("/posts/5");

    expect(await screen.findByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/posts/5/edit",
    );
  });

  it("shows another visitor no Edit link", async () => {
    servePost(post());
    renderRoute("/posts/5");

    await screen.findByRole("heading", { name: "Night dive" });
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("shows a Draft badge", async () => {
    startSignedIn();
    servePost(post({ status: "DRAFT", author: { id: MIRA.id, displayName: MIRA.displayName } }));
    renderRoute("/posts/5");

    expect(await screen.findByText("Draft")).toBeInTheDocument();
  });
});

const mine = (overrides: Partial<Post> = {}) =>
  post({ author: { id: MIRA.id, displayName: MIRA.displayName }, ...overrides });

describe("post/editor: The editor writes a post", () => {
  it("sends a signed-out visitor to the login page", async () => {
    renderRoute("/posts/new");

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("fills the form when editing", async () => {
    startSignedIn();
    serveEditorData();
    servePost(
      mine({
        regionCode: "eg-dahab",
        site: { id: 7, name: "Blue Hole" },
        cover: { id: "c", url: "/media/c", thumbnailUrl: "/media/c/thumb", width: 4, height: 3 },
      }),
    );
    renderRoute("/posts/5/edit");

    expect(await screen.findByLabelText("Title")).toHaveValue("Night dive");
    expect(screen.getByLabelText("Text")).toHaveValue("First paragraph.\n\nSecond paragraph.");
    expect(screen.getByText("Blue Hole")).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Dahab" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Region")).toHaveValue("eg-dahab"));
    expect(document.querySelector('img[src="/media/c/thumb"]')).not.toBeNull();
  });

  it("shows a not-found message for someone else's post", async () => {
    startSignedIn();
    servePost(post());
    renderRoute("/posts/5/edit");

    expect(await screen.findByRole("heading", { name: "Post not found" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });
});

describe("post/editor: The editor saves a draft or publishes", () => {
  it("saves a new draft, and opens its editor with a saved message", async () => {
    startSignedIn();
    serveEditorData();
    let sent: unknown;
    server.use(
      http.post(posts, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(mine({ status: "DRAFT", title: "Mine" }), { status: 201 });
      }),
    );
    servePost(mine({ status: "DRAFT", title: "Mine" }));
    renderRoute("/posts/new");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Title"), " Mine ");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Saved");
    expect(sent).toMatchObject({ title: "Mine", status: "DRAFT", photoIds: [] });
    expect(screen.getByRole("button", { name: "Delete post" })).toBeInTheDocument();
  });

  it("publishes, and opens the post page", async () => {
    startSignedIn();
    serveEditorData();
    let sent: { status?: string } | undefined;
    server.use(
      http.post(posts, async ({ request }) => {
        sent = (await request.json()) as { status?: string };
        return HttpResponse.json(mine(), { status: 201 });
      }),
    );
    servePost(mine());
    renderRoute("/posts/new");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Title"), "Night dive");
    await user.type(screen.getByLabelText("Text"), "Some text");
    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByText("First paragraph.")).toBeInTheDocument();
    expect(sent?.status).toBe("PUBLISHED");
  });

  it("moves a published post to drafts, and shows Publish", async () => {
    startSignedIn();
    serveEditorData();
    let status: Post["status"] = "PUBLISHED";
    let sent: { status?: string } | undefined;
    server.use(
      http.get(`${posts}/5`, () => HttpResponse.json(mine({ status }))),
      http.put(`${posts}/5`, async ({ request }) => {
        sent = (await request.json()) as { status?: string };
        status = "DRAFT";
        return HttpResponse.json(mine({ status }));
      }),
    );
    renderRoute("/posts/5/edit");

    await userEvent.click(await screen.findByRole("button", { name: "Move to drafts" }));

    expect(await screen.findByRole("button", { name: "Publish" })).toBeInTheDocument();
    expect(sent?.status).toBe("DRAFT");
  });

  it("shows a translated error for a missing title, and sends nothing", async () => {
    startSignedIn();
    serveEditorData();
    let sent = false;
    server.use(
      http.post(posts, () => {
        sent = true;
        return HttpResponse.json(mine(), { status: 201 });
      }),
    );
    renderRoute("/posts/new", { language: "uk" });

    await userEvent.click(await screen.findByRole("button", { name: "Зберегти чернетку" }));

    expect(await screen.findByText("Вкажіть заголовок.")).toBeInTheDocument();
    expect(sent).toBe(false);
  });

  it("shows an error on the text when publishing without it, and sends nothing", async () => {
    startSignedIn();
    serveEditorData();
    let sent = false;
    server.use(
      http.post(posts, () => {
        sent = true;
        return HttpResponse.json(mine(), { status: 201 });
      }),
    );
    renderRoute("/posts/new");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Title"), "Night dive");
    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByText("A published post needs text.")).toBeInTheDocument();
    expect(sent).toBe(false);
  });

  it("shows an alert and keeps the values when saving fails", async () => {
    startSignedIn();
    serveEditorData();
    server.use(http.post(posts, () => HttpResponse.json({ status: 500 }, { status: 500 })));
    renderRoute("/posts/new");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Title"), "Night dive");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be saved");
    expect(screen.getByLabelText("Title")).toHaveValue("Night dive");
  });
});

describe("post/editor: The editor links a region and a site", () => {
  it("sets the region from a chosen site", async () => {
    startSignedIn();
    serveEditorData();
    server.use(
      http.get(`${origin}/api/v1/sites/markers`, () =>
        HttpResponse.json([{ id: 7, name: "Blue Hole", lat: 28, lng: 34, regionCode: "eg-dahab" }]),
      ),
      http.get(`${origin}/api/v1/sites/7`, () =>
        HttpResponse.json({ id: 7, name: "Blue Hole", regionCode: "eg-dahab", countryCode: "EG" }),
      ),
    );
    renderRoute("/posts/new");
    const user = userEvent.setup();

    await screen.findByRole("option", { name: "Dahab" });
    expect(screen.getByText("Optional. Search for an approved site.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Site"), "Blue");
    await user.click(await screen.findByRole("button", { name: /Blue Hole/ }));

    await waitFor(() => expect(screen.getByLabelText("Region")).toHaveValue("eg-dahab"));
  });

  it("clears the site when another region is selected", async () => {
    startSignedIn();
    serveEditorData();
    servePost(mine({ regionCode: "eg-dahab", site: { id: 7, name: "Blue Hole" } }));
    renderRoute("/posts/5/edit");
    const user = userEvent.setup();

    await screen.findByRole("option", { name: "Istria" });
    expect(screen.getByText("Blue Hole")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Region"), "hr-istria");

    expect(screen.queryByText("Blue Hole")).not.toBeInTheDocument();
  });
});

describe("post/editor: The editor deletes a post after confirmation", () => {
  function serveDelete() {
    const state = { deleted: false };
    server.use(
      http.delete(`${posts}/5`, () => {
        state.deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    return state;
  }

  it("deletes when confirmed, and opens the profile", async () => {
    startSignedIn();
    serveEditorData();
    servePost(mine());
    const state = serveDelete();
    server.use(
      http.get(`${origin}/api/v1/users/${MIRA.id}`, () =>
        HttpResponse.json({
          id: MIRA.id,
          displayName: MIRA.displayName,
          showDiveLog: true,
          showStatistics: true,
          showCertificates: true,
        }),
      ),
    );
    renderRoute("/posts/5/edit");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Delete post" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: MIRA.displayName }),
    ).toBeInTheDocument();
    expect(state.deleted).toBe(true);
  });

  it("sends nothing when declined, and keeps the form", async () => {
    startSignedIn();
    serveEditorData();
    servePost(mine());
    const state = serveDelete();
    renderRoute("/posts/5/edit");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Delete post" }));
    await user.click(screen.getByRole("button", { name: "Keep it" }));

    expect(state.deleted).toBe(false);
    expect(screen.getByLabelText("Title")).toHaveValue("Night dive");
  });
});

const summary = (overrides: Partial<PostSummary> = {}): PostSummary => ({
  id: 5,
  title: "Night dive",
  excerpt: "We entered at sunset",
  status: "PUBLISHED",
  readMinutes: 3,
  publishedAt: "2026-05-14T10:00:00Z",
  updatedAt: "2026-05-14T10:00:00Z",
  author: OLEH,
  ...overrides,
});

const pageOf = (content: PostSummary[], number = 0, totalPages = 1) => ({
  content,
  page: { number, size: 20, totalElements: content.length, totalPages },
});

function serveProfile(id: number, blog: (page: number) => unknown) {
  const state = { drafts: false };
  server.use(
    http.get(`${origin}/api/v1/users/${id}`, () =>
      HttpResponse.json({
        id,
        displayName: "Oleh Kravets",
        showDiveLog: true,
        showStatistics: true,
        showCertificates: true,
      }),
    ),
    http.get(`${origin}/api/v1/users/${id}/posts`, ({ request }) =>
      HttpResponse.json(blog(Number(new URL(request.url).searchParams.get("page") ?? 0)) as object),
    ),
    http.get(`${posts}/drafts`, () => {
      state.drafts = true;
      return HttpResponse.json(pageOf([summary({ id: 9, title: "Unfinished", status: "DRAFT" })]));
    }),
  );
  return state;
}

describe("user/profile: The profile page shows the author's posts", () => {
  it("shows post cards linking to their posts", async () => {
    serveProfile(21, () =>
      pageOf([summary({ regionCode: "eg-dahab", site: { id: 7, name: "Blue Hole" } })]),
    );
    renderRoute("/users/21");

    expect(await screen.findByRole("link", { name: "Night dive" })).toHaveAttribute(
      "href",
      "/posts/5",
    );
    expect(screen.getByText("We entered at sunset")).toBeInTheDocument();
    expect(screen.getByText(/14 May 2026 · 3 min read/)).toBeInTheDocument();
    expect(screen.getByText("Dahab")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Blue Hole" })).toBeInTheDocument();
  });

  it("pages through the posts", async () => {
    serveProfile(21, (page) => pageOf([summary({ id: page + 1, title: `Post ${page}` })], page, 2));
    renderRoute("/users/21");

    await screen.findByRole("link", { name: "Post 0" });
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByRole("link", { name: "Post 1" })).toBeInTheDocument();
  });

  it("shows no section when there are no posts", async () => {
    serveProfile(21, () => pageOf([]));
    renderRoute("/users/21");

    await screen.findByRole("heading", { level: 1, name: "Oleh Kravets" });
    expect(screen.queryByRole("heading", { name: "Posts" })).not.toBeInTheDocument();
  });

  it("shows the owner the write link and drafts", async () => {
    startSignedIn();
    serveProfile(MIRA.id, () => pageOf([]));
    renderRoute(`/users/${MIRA.id}`);

    expect(await screen.findByRole("link", { name: "Write a post" })).toHaveAttribute(
      "href",
      "/posts/new",
    );
    expect(await screen.findByRole("link", { name: /Unfinished/ })).toHaveAttribute(
      "href",
      "/posts/9/edit",
    );
  });

  it("makes no drafts request for another visitor", async () => {
    startSignedIn();
    const state = serveProfile(21, () => pageOf([summary()]));
    renderRoute("/users/21");

    await screen.findByRole("link", { name: "Night dive" });
    expect(state.drafts).toBe(false);
    expect(screen.queryByRole("link", { name: "Write a post" })).not.toBeInTheDocument();
  });
});
