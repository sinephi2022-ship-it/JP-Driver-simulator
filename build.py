#!/usr/bin/env python3
"""Build app.html (page body, also published as a Claude artifact) from src/, then wrap it into a standalone index.html for GitHub Pages."""
import pathlib
root = pathlib.Path(__file__).parent
js = "\n".join(p.read_text(encoding="utf-8") for p in sorted((root / "src/js").glob("*.js")))
app = (root / "src/head.html").read_text(encoding="utf-8") + "<script>\n(() => {\n'use strict';\n" + js + "\n})();\n</script>\n"
(root / "app.html").write_text(app, encoding="utf-8")
HEAD = """<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="路上教習">
<meta name="theme-color" content="#0f1622">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icon-192.png">
<style>
:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px);box-sizing:border-box}
body{margin:0}
img{max-width:100%}
[hidden]{display:none!important}
</style>
</head>
<body>
"""
(root / "index.html").write_text(HEAD + app + "\n</body>\n</html>\n", encoding="utf-8")
print("app.html + index.html written,", len(app) // 1024, "KB")
