# Balancer V2 & V3 Deployment Documentation Scripts

These scripts make it easy to generate deployment diagrams for Balancer contracts, showing all versions of a particular product (e.g., weighted pool), over time. The output is in the form of SVG files, which can be copied to the public docs or used in illustrations.

The graphs are made in [Graphviz](https://graphviz.org/) (as this is CI-compatible, and we might want to automate this at some point). You need to have this installed to generate the graphics, along with Python 3. It's easy to install; e.g., `brew install graphviz` on a Mac; `sudo apt install graphviz` on Linux.

There are then three steps involved in making a graph.

## 1 - Gather information from the README

From the top level, run: `python3 src/scripts/parse_readme.py`

There might be some minor discrepancies with what's in the directories, but the essential state of the contracts is recorded in the README.md file. This is where we record all the versions, and note whether things are deprecated or not.

The tool uses heuristics to determine which "family" a deployment belongs to. For instance, it assumes successor versions of "weighted-pool" will be named "weighted-pool-v#". We have not always followed this convention. In particular, V2 of "20250121-v3-stable-surge" is actually "20250404-v3-stable-surge-pool-factory-v2", where it technically should have been "20250404-v3-stable-surge-v2".

Since these names are recorded in the on-chain metadata, we cannot rename anything. Since the graph depends on related things sharing a "family," the solution is to put any exceptions in the "family_overrides.json" file (also in the scripts directory). For now, it just contains the stable surge deployments.

The output will be `docs/deployments.json`: a parsed list of all deployments, with their status, version, and family recorded. This is the base file used to generate graphs.

As a side effect, it also produces the `docs/families.txt` file, a simple list of all the families (i.e., contract version groupings). This comes in handy when you want to select a subset of families from which to produce some graphics.

## 2 - Generate Graph Data

From the top level, run: `python3 src/scripts/make_graph.py docs/deployments.json docs/output/<mygraph>.dot [family1,family2,family3,...]`

This script reads deployments.json and generates a Graphviz .dot file, which can then be rendered graphically. If you provide comma-separated "family" arguments, it will generate data for a subset of all the deployments. For instance, to generate a graph of the V3 routers, the command would be:

`python3 src/scripts/make_graph.py docs/deployments.json docs/output/routers.dot v3-router,v3-batch-router,v3-composite-liquidity-router,v3-prepaid-composite-liquidity-router,v3-buffer-router`

This generates a routers.dot file in docs/output.

## 3 - Generate the Image

To render the .dot file as an SVG, the command is:

`dot -Tsvg routers.dot -o router-deployments.svg`

See the Graphviz documentation for other possibilities. Note that the format can be manipulated very easily in the .dot file (which is just text).

Note the "rankdir" setting near the very top:

  rankdir=TB;

"TB" means top-to-bottom. This setting will generate a wide image with successive versions moving down the page.
If you set it to "LR", it will orient left-to-right. In other words, you will get a tall image with successive versions moving across the page.

Further styling is contained in the `generate_dot` function of the `make_graph.py` script; for instance, styling for v2 vs. v3, deprecated vs. active, etc.
