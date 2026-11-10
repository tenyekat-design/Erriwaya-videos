#!/usr/bin/env python3
"""Builds assets/index.html (the app's page, which is also a complete offline website) from
web/index-source.html (the page as published on the web, with Google Fonts links): the font links are
replaced by the bundled assets/fonts.css and the page gets its own <html>/<head>.

    python3 tools/build-page.py
"""
import os, re
HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
s = open(os.path.join(HERE, 'web', 'index-source.html'), encoding='utf-8').read()
s = re.sub(r'<link rel="preconnect"[^\n]*\n', '', s)
s = re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^\n]*', '<link rel="stylesheet" href="fonts.css">', s)
i = s.index('</style>') + len('</style>')
page = ('<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
        '<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n'
        + s[:i] + '\n</head>\n<body>' + s[i:] + '</body>\n</html>\n')
open(os.path.join(HERE, 'assets', 'index.html'), 'w', encoding='utf-8').write(page)
print('assets/index.html written')
