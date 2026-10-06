"""Inline config.js, plan.js, app.js and styles.css into one HTML file (for a single-file demo)."""
import pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent / 'public'
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + (root / 'styles.css').read_text() + '\n</style>')
for f in ['config.js', 'plan.js', 'app.js']:
    html = html.replace(f'<script src="{f}"></script>', '<script>\n' + (root / f).read_text().replace('</script', '<\\/script') + '\n</script>')
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'study-diary-demo.html')
out.write_text(html); print(out, len(html), 'bytes')
