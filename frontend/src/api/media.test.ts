import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { authResponse } from "../test/auth";
import { refreshUrl, server } from "../test/server";
import { ApiError } from "./ApiError";
import { uploadMedia } from "./media";
import { resetSession, signIn } from "./session";

const mediaUrl = () => `${window.location.origin}/api/v1/media`;
const ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const UPLOADED = {
  id: ID,
  url: `/media/${ID}`,
  thumbnailUrl: `/media/${ID}/thumb`,
  contentType: "image/jpeg",
  width: 1200,
  height: 800,
};

const photo = () =>
  new File([new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3])], "reef.jpg", { type: "image/jpeg" });

afterEach(() => resetSession());

describe("media/uploads: uploadMedia", () => {
  it("sends the file as multipart with the bearer token", async () => {
    signIn(authResponse("token-1"));
    let authorization: string | null = null;
    let contentType = "";
    let part: FormDataEntryValue | null = null;
    server.use(
      http.post(mediaUrl(), async ({ request }) => {
        authorization = request.headers.get("Authorization");
        contentType = request.headers.get("Content-Type") ?? "";
        part = (await request.formData()).get("file");
        return HttpResponse.json(UPLOADED, { status: 201 });
      }),
    );

    const media = await uploadMedia(photo());

    expect(media).toEqual(UPLOADED);
    expect(authorization).toBe("Bearer token-1");
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(part).toBeInstanceOf(File);
    expect((part as unknown as File).name).toBe("reef.jpg");
    expect((part as unknown as File).size).toBe(6);
  });

  it("refreshes the session once on a 401 and retries with the new token", async () => {
    signIn(authResponse("expired"));
    const tokens: (string | null)[] = [];
    server.use(
      http.post(refreshUrl(), () => HttpResponse.json(authResponse("token-2"))),
      http.post(mediaUrl(), async ({ request }) => {
        tokens.push(request.headers.get("Authorization"));
        const file = (await request.formData()).get("file");
        if (request.headers.get("Authorization") !== "Bearer token-2" || !(file instanceof File)) {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json(UPLOADED, { status: 201 });
      }),
    );

    await expect(uploadMedia(photo())).resolves.toEqual(UPLOADED);
    expect(tokens).toEqual(["Bearer expired", "Bearer token-2"]);
  });

  it("rejects with ApiError carrying the status", async () => {
    signIn(authResponse());
    server.use(
      http.post(mediaUrl(), () =>
        HttpResponse.json(
          {
            status: 415,
            title: "Unsupported Media Type",
            detail: "Only JPEG, PNG and WebP images are accepted.",
          },
          { status: 415, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );

    const error = await uploadMedia(photo()).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(415);
  });

  it("rejects with a network ApiError when there is no response", async () => {
    signIn(authResponse());
    server.use(http.post(mediaUrl(), () => HttpResponse.error()));

    const error = await uploadMedia(photo()).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe("network");
  });
});
