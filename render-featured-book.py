#!/usr/bin/env python3
"""Render the featured book from its record — the swap procedure.

Single source of truth: public/assets/featured-book.json (pointer, one slug)
+ public/gift-data/<slug>.json (the book record: title, author, blurb, cover,
format links, chapter/page counts, published date, publisher).

WHAT IT GENERATES (all values come from the record — nothing is hardcoded):
  - public/books/<slug>/index.html        (the book page)
  - the featured card + modal in public/bookshelf/index.html
  - the featured block in public/press/index.html
  - the featured line in public/about/index.html
  - the shelf-feature block in public/index.html (homepage)

HOW TO SWAP THE FEATURED BOOK LATER (not surgery):
  1. Drop the new book's files into public/books/ + public/assets/ (cover).
  2. Write its record as public/gift-data/<new-slug>.json (copy no-contact.json).
  3. Flip the slug in public/assets/featured-book.json.
  4. Run: python3 render-featured-book.py
  5. Deploy the preview channel, eyes-on pass, then live on Steve's word.
  Old book pages stay live as catalog entries; only the pointer moves.

The script FAILS LOUDLY (non-zero exit) if a marker pair is missing, a
required record field is absent, a linked file is missing from public/, or
any {{placeholder}} survives. Never hand-edit generated regions: re-run.
"""
import json
import os
import re
import sys
from datetime import date

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
TEMPLATES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")

REQUIRED = ["slug", "title", "author", "blurb", "genre", "chapters", "pages",
            "published", "publisher", "shelfByline", "coverUrl", "pdfUrl",
            "epubUrl", "kindleUrl"]


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def human_date(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return date(y, m, d).strftime("%B %-d, %Y")


def fill(template, values):
    out = template
    for k, v in values.items():
        out = out.replace("{{" + k + "}}", str(v))
    left = re.findall(r"\{\{[^}]+\}\}", out)
    if left:
        raise SystemExit(f"unfilled placeholders: {sorted(set(left))}")
    return out


def splice(path, begin, end, fragment):
    with open(path, encoding="utf-8") as f:
        html = f.read()
    if html.count(begin) != 1 or html.count(end) != 1:
        raise SystemExit(f"{path}: expected exactly one {begin} / {end} pair")
    pattern = re.compile(re.escape(begin) + r".*?" + re.escape(end), re.S)
    new = pattern.sub(begin + "\n" + fragment + "\n" + end, html, count=1)
    if new == html:
        print(f"{path}: splice unchanged (generated fragment matches existing content)")
        return
    with open(path, "w", encoding="utf-8") as f:
        f.write(new)


def main():
    pointer = load_json(os.path.join(ROOT, "assets", "featured-book.json"))
    slug = pointer["slug"]
    record = load_json(os.path.join(ROOT, "gift-data", f"{slug}.json"))
    if record["slug"] != slug:
        raise SystemExit("pointer slug != record slug")
    for field in REQUIRED:
        if field not in record or record[field] in (None, ""):
            raise SystemExit(f"record missing required field: {field}")
    for url in (record["coverUrl"], record["pdfUrl"], record["epubUrl"],
                record["kindleUrl"]):
        local = os.path.join(ROOT, url.lstrip("/"))
        if not os.path.exists(local) or os.path.getsize(local) == 0:
            raise SystemExit(f"linked file missing/empty in public/: {url}")

    byline_lower = record["shelfByline"].lower()
    about_block = ""
    if record.get("aboutAuthor"):
        about_block = (
            '        <h2 style="margin-top:24px">About the author</h2>\n'
            f"        <p>{record['aboutAuthor']}</p>\n"
        )
    values = {
        "SLUG": slug,
        "TITLE": record["title"],
        "AUTHOR": record["author"],
        "BLURB": record["blurb"],
        "GENRE": record["genre"],
        "CHAPTERS": record["chapters"],
        "PAGES": record["pages"],
        "PUBLISHED": record["published"],
        "PUBLISHED_HUMAN": human_date(record["published"]),
        "PUBLISHER": record["publisher"],
        "SHELF_BYLINE": record["shelfByline"],
        "SHELF_BYLINE_LOWER": byline_lower,
        "COVER_URL": record["coverUrl"],
        "PDF_URL": record["pdfUrl"],
        "EPUB_URL": record["epubUrl"],
        "KINDLE_URL": record["kindleUrl"],
        "BOOK_URL": f"/books/{slug}/",
        "ABOUT_AUTHOR_BLOCK": about_block,
    }

    def template(name):
        with open(os.path.join(TEMPLATES, name), encoding="utf-8") as f:
            return f.read()

    # 1. Book page
    book_dir = os.path.join(ROOT, "books", slug)
    os.makedirs(book_dir, exist_ok=True)
    page = fill(template("book-page.html"), values)
    assert page.count(record["title"]) >= 5, "book page title count"
    with open(os.path.join(book_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(page)
    print(f"wrote books/{slug}/index.html")

    # 2-5. Splices
    splice(os.path.join(ROOT, "bookshelf", "index.html"),
           "<!-- FEATURED-BOOK-CARD:BEGIN -->",
           "<!-- FEATURED-BOOK-CARD:END -->",
           fill(template("shelf-card.html"), values))
    splice(os.path.join(ROOT, "bookshelf", "index.html"),
           "<!-- FEATURED-BOOK-MODAL:BEGIN -->",
           "<!-- FEATURED-BOOK-MODAL:END -->",
           fill(template("shelf-modal.html"), values))
    splice(os.path.join(ROOT, "press", "index.html"),
           "<!-- PRESS-FEATURED-BOOK:BEGIN -->",
           "<!-- PRESS-FEATURED-BOOK:END -->",
           fill(template("press-featured.html"), values))
    splice(os.path.join(ROOT, "about", "index.html"),
           "<!-- FEATURED-BOOK-ABOUT:BEGIN -->",
           "<!-- FEATURED-BOOK-ABOUT:END -->",
           fill(template("about-featured.html"), values))
    splice(os.path.join(ROOT, "index.html"),
           "<!-- HOMEPAGE-FEATURED-BOOK:BEGIN -->",
           "<!-- HOMEPAGE-FEATURED-BOOK:END -->",
           fill(template("homepage-featured.html"), values))
    print("spliced: shelf card + modal, press featured, about line, homepage feature")
    print(f"SWAP (later): new record + flip assets/featured-book.json + re-run + deploy. Featured now: {record['title']} by {record['author']}")


if __name__ == "__main__":
    main()
