#!/usr/bin/env python3
import json
import sys
from pathlib import Path
from datetime import date


def load_records(json_path: str | Path):
    data = json.loads(Path(json_path).read_text(encoding="utf-8"))
    for r in data:
        d = r.get("date")
        r["date_obj"] = date.fromisoformat(d) if d else None
        # default version to v1 if missing
        if not r.get("version"):
            r["version"] = "v1"
    return data


def make_node_id(r: dict) -> str:
    base = r["task_id"].replace("-", "_").replace(".", "_")
    status = r.get("status", "unknown")
    return f"n_{base}_{status}"


def make_label(r: dict) -> str:
    d = r["date_obj"].isoformat() if r.get("date_obj") else "unknown date"
    desc = r["description"]
    version = r.get("version") or "v1"
    status = r.get("status", "")
    return f"{desc}\\n{d} ({version}, {status})"


def generate_dot(records, family_order: list[str] | None) -> str:
    # Group by family
    families: dict[str, list[dict]] = {}
    for r in records:
        fam = r["family"]
        families.setdefault(fam, []).append(r)

    # Decide cluster order
    if family_order:
        # Only include families that actually exist in this dataset
        ordered_families = [f for f in family_order if f in families]
        # Any remaining families that weren't explicitly ordered go after, sorted
        remaining = sorted(f for f in families.keys() if f not in family_order)
        ordered_families.extend(remaining)
    else:
        # No explicit order → default to sorted
        ordered_families = sorted(families.keys())

    lines: list[str] = []
    lines.append('digraph balancer_deployments {')
    lines.append('  rankdir=TB;')  # vertical: time top -> bottom
    lines.append('  graph [splines=true, overlap=false];')
    lines.append('  node [shape=box, fontname="Helvetica", fontsize=9];')

    for fam in ordered_families:
        fam_records = families[fam]
        cluster_name = f"cluster_{fam.replace('-', '_')}"
        lines.append(f'  subgraph {cluster_name} {{')
        lines.append(f'    label="{fam}";')
        lines.append('    style=dashed; color="#dddddd"; fontsize=10;')

        # Sort by date inside family (full history)
        fam_records = sorted(
            fam_records, key=lambda r: r["date_obj"] or date.min
        )
        prev_node_id = None

        for r in fam_records:
            node_id = make_node_id(r)
            label = make_label(r)

            # Color by ecosystem
            if r.get("ecosystem") == "v3":
                fill = "#d4edda"   # light green
                border = "#155724"
            else:
                fill = "#cce5ff"   # light blue (v2 or unknown)
                border = "#004085"

            # Style by status
            if r.get("status") == "deprecated":
                style = 'style="filled,dashed"'
            else:
                style = 'style="filled,solid"'

            lines.append(
                f'    {node_id} [label="{label}", fillcolor="{fill}", '
                f'color="{border}", {style}];'
            )

            # lineage edge within the same family
            if prev_node_id is not None:
                lines.append(
                    f'    {prev_node_id} -> {node_id} '
                    f'[style=dashed, color="#888888"];'
                )

            prev_node_id = node_id

        lines.append('  }')

    lines.append('}')
    return "\n".join(lines)


def main():
    if len(sys.argv) < 3:
        print(
            "Usage:\n"
            "  make_graph.py docs/deployments.json output.dot [family1,family2,...]\n\n"
            "If no families are given, all families are included.",
            file=sys.stderr,
        )
        sys.exit(1)

    json_path = sys.argv[1]
    out_path = Path(sys.argv[2])

    family_order: list[str] | None = None
    family_filter_set = None

    if len(sys.argv) >= 4 and sys.argv[3].strip():
        # preserve order as list; also build a set for fast membership checks
        family_order = [f.strip() for f in sys.argv[3].split(",") if f.strip()]
        family_filter_set = set(family_order)

    records = load_records(json_path)

    if family_filter_set:
        records = [r for r in records if r["family"] in family_filter_set]

    dot = generate_dot(records, family_order)
    out_path.write_text(dot, encoding="utf-8")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
