#!/usr/bin/env python3
"""Check the published guides for the failures a reader would find first.

Run it before pushing:

    python3 check-guides.py

There is no build step here — edit index.html and push — so nothing else stands
between a typo and a live page. These are the three faults that do not announce
themselves:

1. A MISSING TRANSLATION IS INVISIBLE, NOT OBVIOUS.
   The stylesheet hides `[lang="en"]` on a Spanish page. A paragraph written in
   English only does not fall back to English — it vanishes, leaving a silent
   gap on the page of the reader least able to work around it.

2. A MISSING IMAGE IS A BROKEN ICON.
   Guides carry two image sets (`assets/img/` and `assets/img/es/`), swapped by
   the language toggle. An `<img>` that gained `data-src-es` before the Spanish
   capture landed breaks only in Spanish.

3. AN UNCLOSED TAG SWALLOWS THE REST OF THE PAGE.
   These files are hand-edited HTML, and a dropped `</section>` can hide
   everything after it in some browsers.
"""
import glob
import os
import re
import sys
from html.parser import HTMLParser

VOID = {'meta', 'img', 'br', 'link', 'input', 'hr', 'source', 'area', 'col'}


class Balance(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack, self.errors = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append((tag, self.getpos()[0]))

    def handle_endtag(self, tag):
        if not self.stack:
            self.errors.append(f'line {self.getpos()[0]}: stray </{tag}>')
            return
        open_tag, line = self.stack[-1]
        if open_tag != tag:
            self.errors.append(
                f'line {self.getpos()[0]}: </{tag}> closes <{open_tag}> opened on line {line}')
        else:
            self.stack.pop()


def check(path):
    """Returns a list of problems with one guide."""
    problems = []
    base = os.path.dirname(path)
    src = open(path, encoding='utf8').read()

    # 1. every translatable node exists in both languages, in en-then-es order
    body = src[src.index('<body>'):]
    seq = re.findall(r'lang="(en|es)"', body)
    n_en, n_es = seq.count('en'), seq.count('es')
    if n_en != n_es:
        problems.append(f'{n_en} English nodes but {n_es} Spanish ones — '
                        'a node with no translation is INVISIBLE on the other page')
    for i in range(0, len(seq) - 1, 2):
        if seq[i] != 'en' or seq[i + 1] != 'es':
            line = body[:[m.start() for m in re.finditer(r'lang="(?:en|es)"', body)][i]].count('\n') + 1
            problems.append(f'language nodes stop alternating around line {line} '
                            f'of <body> (saw {seq[i]} then {seq[i + 1]})')
            break

    # 2. every image referenced actually exists
    for ref in sorted(set(re.findall(r'(?:src|data-src-en|data-src-es)="([^"]+\.png)"', src))):
        if not os.path.exists(os.path.join(base, ref)):
            problems.append(f'missing image: {ref}')

    # 3. the markup closes
    parser = Balance()
    parser.feed(src)
    problems.extend(parser.errors)
    problems.extend(f'never closed: <{tag}> opened on line {line}'
                    for tag, line in parser.stack)
    return problems


def main():
    guides = sorted(glob.glob('guides/*/index.html'))
    if not guides:
        print('no guides found — run this from the repository root', file=sys.stderr)
        return 2

    failed = 0
    for path in guides:
        name = os.path.basename(os.path.dirname(path))
        problems = check(path)
        if problems:
            failed += 1
            print(f'✗ {name}')
            for problem in problems:
                print(f'    {problem}')
        else:
            print(f'✓ {name}')

    print()
    print(f'{len(guides) - failed}/{len(guides)} guides clean')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
