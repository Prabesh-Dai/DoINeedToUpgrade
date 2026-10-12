export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Canonical path for a game page. Names with no latin letters or digits slugify to "", so they get no slug segment. */
export function gamePath(appid: number | string, name: string): string {
  const slug = slugify(name);
  return slug ? `/game/${appid}/${slug}` : `/game/${appid}`;
}
