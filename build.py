#!/usr/bin/env python3
"""Wrap app.html (the page body, also published as a Claude artifact) into a standalone index.html for GitHub Pages."""
import pathlib
root = pathlib.Path(__file__).parent
HEAD = """<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px);box-sizing:border-box}
body{margin:0}
img{max-width:100%}
[hidden]{display:none!important}
</style>
</head>
<body>
"""
(root / "index.html").write_text(HEAD + (root / "app.html").read_text(encoding="utf-8") + "\n</body>\n</html>\n", encoding="utf-8")
print("index.html written")
