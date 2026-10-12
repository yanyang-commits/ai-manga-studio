from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
root = Path(__file__).resolve().parents[1] / 'dist'
errors = []
class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for k, v in attrs:
            if k not in ('href', 'src') or not v or v.startswith(('#', 'http:', 'https:', 'data:', 'mailto:')):
                continue
            path = unquote(urlsplit(v).path)
            if path and not (self.file.parent / path).is_file():
                errors.append(f'{self.file.name}: missing {v}')
for file in root.glob('*.html'):
    parser = Links(); parser.file = file; parser.feed(file.read_text())
if errors:
    raise SystemExit('\n'.join(errors))
print('PASS: all static page links and assets exist')
