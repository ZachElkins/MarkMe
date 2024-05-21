# MarkMe

Markdown parser experiment

## Rules
|Syntax|Result|HTML|
|-|-|-|
|`# Header 1`|<h1>Header 1</h1>|`<h1>Header 1</h1>`|
|`## Header 2`|<h2>Header 2</h2>|`<h2>Header 2</h2>`|
|`### Header 3`|<h3>Header 3</h3>|`<h3>Header 3</h3>`|
|`#### Header 4` (Matches`#{4,}\s\w+`)|<h4>Header 4</h4>|`<h4>Header 4</h4>`|
|`**bold**`, `__bold__`|__bold__|`<strong>bold</strong>`|
|`*italic*`, `_italic_`|_italic_|`<em>italic</em>`|
|`~strike~`, `~~strike~~`|~~strike~~|`<del>strike</del>`|
|`---`|<hr/>|`<hr/>`|
|`[hyperlink](https://google.com)`|[hyperlink](https://google.com)|`<a href="https://google.com">hyperlink</a>`|
