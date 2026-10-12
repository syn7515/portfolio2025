"""Compile a copied prototype's Tailwind classes ahead of time, with its own vendored runtime.

    python3 scripts/compile-prototype-tailwind.py public/prototypes/alphagrill-cook v0-4
    python3 scripts/compile-prototype-tailwind.py public/prototypes/alphagrill-quick-button v14,v0

Every token in the pages' markup and scripts (and the folder's shared/js) that could be a class is
handed to shared/vendor/tailwind-browser.js in one element, in headless Chrome. The CSS it builds is
what the pages would have compiled at load, and on every later class change, for any class they
ever set; it is written to the folder's shared/css/tailwind.css, which the pages link instead of
loading the runtime. Run it again when a page starts using a class it never used before."""
import html, pathlib, re, subprocess, sys, tempfile

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
root = pathlib.Path(sys.argv[1]).resolve()          # e.g. public/prototypes/alphagrill-cook
pages = sys.argv[2].split(",")                      # e.g. v0-4  or  v14,v0
work = pathlib.Path(tempfile.mkdtemp())

sources = [root / "shared/js/app.js", root / "shared/js/menu.js"]
for p in pages:
    sources += [root / p / "index.html", *sorted((root / p / "js").glob("*.js"))]
tokens = set()
for f in sources:
    tokens.update(t for t in re.split(r"[\s\"'`<>{};]+", f.read_text()) if t and len(t) < 160)

# The pages' own Tailwind input, as their <style type="text/tailwindcss"> had it (the same in v0-4,
# v14 and v0) before the compiled sheet replaced it.
theme = """<style type="text/tailwindcss">
    /* Theme tokens from the app's global.css that these screens rely on. */
    :root { --radius: 0.625rem; }
    @theme inline {
      --radius-sm: calc(var(--radius) - 4px);
      --radius-md: calc(var(--radius) - 2px);
      --radius-lg: var(--radius);
      --radius-xl: calc(var(--radius) + 4px);
      --shadow-switch-red: inset 0 0 12px 0 rgb(0 0 0 / 0.5);
    }
  </style>"""

gen = work / f"gen-{root.name}.html"
gen.write_text(f"""<!doctype html><html><head><meta charset="utf-8">
{theme}
<script src="{(root / 'shared/vendor/tailwind-browser.js').as_uri()}"></script>
</head><body><div class="{html.escape(' '.join(sorted(tokens)), quote=True)}"></div></body></html>""")
dom = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--allow-file-access-from-files",
                      "--virtual-time-budget=8000", "--dump-dom", gen.as_uri()],
                     capture_output=True, text=True, timeout=120).stdout
styles = re.findall(r"<style>(.*?)</style>", dom, re.S)
css = next(s for s in styles if "tailwindcss v4" in s)
css = html.unescape(css)
HEADER = f"""/* portfolio: the Tailwind classes of {' and '.join(pages)}, compiled ahead of time by shared/vendor/tailwind-browser.js
   (the runtime the pages loaded) from every token in their markup and scripts that could be a class,
   so the pages no longer compile them at load and rescan on every class change. Regenerate with
   scripts/compile-prototype-tailwind.py when a page starts using a class it has never used before. */
"""
(root / "shared/css/tailwind.css").write_text(HEADER + css)
print(root.name, "sources", len(sources), "tokens", len(tokens), "css bytes", len(css))
