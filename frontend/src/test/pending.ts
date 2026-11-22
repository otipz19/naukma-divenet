/**
 * A response the test releases by hand, so a page can be checked while its request is pending
 * (spec shared/web-app: loading placeholders). `wait` is an MSW resolver that resolves with `release`.
 */
export function heldResponse() {
  let release!: (response: Response) => void;
  const response = new Promise<Response>((resolve) => {
    release = resolve;
  });
  return { wait: () => response, release };
}
