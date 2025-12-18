#!/usr/bin/env python3
import re
import json
from pathlib import Path
from datetime import datetime

README_PATH = Path("README.md")
OVERRIDES_PATH = Path("src/scripts/family_overrides.json")

def extract_table(text: str, start_marker: str, end_marker: str | None):
    start_idx = text.index(start_marker)
    if end_marker is not None:
        end_idx = text.index(end_marker, start_idx)
        section = text[start_idx:end_idx]
    else:
        section = text[start_idx:]
    lines = [l for l in section.splitlines() if l.strip().startswith("|")]
    return lines


ROW_PATTERN = re.compile(r"^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$")


def parse_rows(lines, status):
    records = []
    for line in lines:
        line = line.rstrip()
        if line.startswith("| ---"):
            continue  # header separator
        m = ROW_PATTERN.match(line)
        if not m:
            continue
        desc, task_cell = m.groups()

        # Task ID is inside backticks
        m_id = re.search(r"\[`([^`]+)`\]", task_cell)
        if not m_id:
            continue
        task_id = m_id.group(1)

        # Path is inside (...)
        m_path = re.search(r"\(([^)]+)\)", task_cell)
        path = m_path.group(1) if m_path else None

        # Extract date and slug: YYYYMMDD-something
        date_raw = None
        slug = task_id
        if re.match(r"^\d{8}-", task_id):
            date_raw = task_id[:8]
            slug = task_id[9:]

        # Ecosystem from path
        ecosystem = None
        if path:
            if "/v2/" in path:
                ecosystem = "v2"
            elif "/v3/" in path:
                ecosystem = "v3"

        # Version: trailing -vN or -vN.M
        m_ver = re.search(r"-v(\d+(?:\.\d+)?)$", slug)
        version = None
        if m_ver:
            version = "v" + m_ver.group(1)

        # Family: slug without trailing version tag
        family = re.sub(r"-v\d+(?:\.\d+)?$", "", slug)

        # Date
        date_iso = None
        if date_raw:
            try:
                d = datetime.strptime(date_raw, "%Y%m%d").date()
                date_iso = d.isoformat()
            except ValueError:
                date_iso = None

        # Interpret missing version as v1
        if not version:
            version = "v1"

        records.append(
            dict(
                description=desc.strip(),
                task_id=task_id,
                date=date_iso,
                date_raw=date_raw,
                slug=slug,
                family=family,
                family_source="derived",
                version=version,
                ecosystem=ecosystem,
                status=status,
                path=path,
            )
        )
        
    return records


def load_overrides():
    if not OVERRIDES_PATH.exists():
        return {}
    return json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))


def main():
    text = README_PATH.read_text(encoding="utf-8")

    active_lines = extract_table(text, "## Active Deployments", "## Scripts")
    deprecated_lines = extract_table(text, "## Deprecated Deployments", None)

    active_records = parse_rows(active_lines, "active")
    deprecated_records = parse_rows(deprecated_lines, "deprecated")

    all_records = active_records + deprecated_records

    overrides = load_overrides()
    task_id_overrides = overrides.get("task_id_overrides", {})

    for r in all_records:
        if r["task_id"] in task_id_overrides:
            r["family"] = task_id_overrides[r["task_id"]]
            r["family_source"] = "override"

    json.dump(all_records, fp=open("docs/deployments.json", "w", encoding="utf-8"),
              indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
