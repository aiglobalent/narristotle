#!/usr/bin/env python3
"""Phone-width check for the narristotle preview channel.

Usage: python3 phone-check.py [base-url]
Screenshots each page at 390x844 (iPhone-ish) into /tmp/narristotle-phone/,
and reports horizontal overflow (scrollWidth vs innerWidth) plus any element
wider than the viewport. Desktop is covered by the browser eyes-on pass;
this covers the phone layout the browser window cannot show.
"""
import json
import os
import sys
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


def proxy_arg():
    # VM egress goes through an authenticated proxy; curl picks it up from
    # the environment, Chromium needs it spelled out. Credentials are never
    # printed or stored — parsed here and handed straight to the launcher.
    raw = (os.environ.get("https_proxy") or os.environ.get("HTTPS_PROXY")
           or os.environ.get("http_proxy") or os.environ.get("HTTP_PROXY"))
    if not raw:
        return {}
    u = urlparse(raw)
    server = f"{u.scheme}://{u.hostname}:{u.port}"
    proxy = {"server": server}
    if u.username:
        proxy["username"] = u.username
    if u.password:
        proxy["password"] = u.password
    return {"proxy": proxy}

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://narristotle--publish-queue-3erlj5in.web.app"
PAGES = [
    ("home", "/"),
    ("book", "/books/no-contact/"),
    ("press", "/press/"),
    ("log", "/press/log/"),
    ("about", "/about"),
    ("bookshelf", "/bookshelf/"),
]
OUT = "/tmp/narristotle-phone"
os.makedirs(OUT, exist_ok=True)

JS_OVERFLOW = """() => {
  const vw = window.innerWidth;
  const bad = [];
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > vw + 1) {
      bad.push(el.tagName + '.' + (el.className && el.className.baseVal === undefined ? String(el.className).split(' ')[0] : '') + ' w=' + Math.round(r.width));
    }
  });
  return {scrollWidth: document.documentElement.scrollWidth, innerWidth: vw, offenders: bad.slice(0, 10)};
}"""

with sync_playwright() as p:
    host = urlparse(BASE).hostname or ""
    browser = p.chromium.launch(**({} if host in ("localhost", "127.0.0.1", "::1") else proxy_arg()))
    page = browser.new_page(viewport={"width": 390, "height": 844})
    for name, path in PAGES:
        url = BASE + path
        page.goto(url, wait_until="networkidle")
        page.wait_for_timeout(500)
        info = page.evaluate(JS_OVERFLOW)
        page.screenshot(path=os.path.join(OUT, f"{name}.png"), full_page=True)
        status = "OK " if info["scrollWidth"] <= info["innerWidth"] + 1 and not info["offenders"] else "OVERFLOW"
        print(f"{status} {name:9s} {url} scrollWidth={info['scrollWidth']} offenders={json.dumps(info['offenders'])}")
    browser.close()
print("screenshots in", OUT)
