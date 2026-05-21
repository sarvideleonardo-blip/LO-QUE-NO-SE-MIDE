#!/usr/bin/env python3
"""noXcuro ingestion agent (OpenRouter -> Obsidian node)."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


@dataclass
class Config:
    api_key: str
    model: str
    vault_path: Path
    inbox_file: Path
    nodes_folder: Path


def load_dotenv(dotenv_path: Path = Path('.env')) -> None:
    if not dotenv_path.exists():
        return
    for line in dotenv_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


def normalize_api_key(raw_key: str) -> str:
    key = raw_key.strip().strip('"').strip("'")
    if not key:
        raise ValueError("Falta API key. Usa OPENROUTER_API_KEY o config.json -> api_key.")
    if key.lower().startswith('bearer '):
        key = key[7:].strip()
    return key


def load_config(config_path: Path) -> Config:
    load_dotenv()
    raw = json.loads(config_path.read_text(encoding="utf-8"))
    api_key = normalize_api_key(os.getenv("OPENROUTER_API_KEY", raw.get("api_key", "")))

    vault_path = Path(raw["vault_path"]).expanduser()
    inbox_rel = raw.get("inbox_file", "00inbox/captura.md").replace("00imbox", "00inbox")
    nodes_rel = raw.get("nodes_folder", "01nodes")

    return Config(
        api_key=api_key,
        model=raw.get("model", "meta-llama/llama-3.1-8b-instruct:free"),
        vault_path=vault_path,
        inbox_file=vault_path / inbox_rel,
        nodes_folder=vault_path / nodes_rel,
    )


def build_prompt(text: str) -> str:
    return (
        "Clasifica esta captura noXcuro y responde SOLO JSON con llaves: "
        "category, tags, core_nucleus, stage_cognitive, relations_semantic, recurrence_topics.\n\n"
        f"Texto:\n{text}"
    )


def call_openrouter(model: str, api_key: str, prompt: str) -> dict[str, Any]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }
    r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)
    if r.status_code == 401:
        raise RuntimeError(
            "Error API 401 (auth). Revisa OPENROUTER_API_KEY en .env o entorno, "
            "y confirma que sea una key de OpenRouter activa."
        )
    if r.status_code >= 400:
        raise RuntimeError(f"Error API {r.status_code}: {r.text}")
    data = r.json()
    content = data["choices"][0]["message"]["content"]
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1:
            raise RuntimeError(f"La IA no devolvió JSON válido: {content}")
        return json.loads(content[start : end + 1])


def save_node(cfg: Config, raw_text: str, analysis: dict[str, Any]) -> Path:
    now = datetime.now(timezone.utc)
    stamp = now.strftime("%Y-%m-%dT%H-%M-%SZ")
    out = cfg.nodes_folder / f"{stamp} - nodo.md"
    cfg.nodes_folder.mkdir(parents=True, exist_ok=True)

    fm = {
        "id": stamp,
        "created_at": now.isoformat(),
        "source": "agente",
        "category": analysis.get("category", "Metodo"),
        "core_nucleus": analysis.get("core_nucleus", ""),
        "stage_cognitive": analysis.get("stage_cognitive", ""),
        "tags": analysis.get("tags", []),
        "relations_semantic": analysis.get("relations_semantic", []),
        "recurrence_topics": analysis.get("recurrence_topics", []),
    }

    yaml_lines = ["---"] + [f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in fm.items()] + ["---", "", "# Texto", raw_text, ""]
    out.write_text("\n".join(yaml_lines), encoding="utf-8")
    return out


def main() -> None:
    cfg = load_config(Path("config.json"))
    text = cfg.inbox_file.read_text(encoding="utf-8").strip()
    if not text:
        raise RuntimeError(f"Inbox vacío: {cfg.inbox_file}")
    analysis = call_openrouter(cfg.model, cfg.api_key, build_prompt(text))
    node_path = save_node(cfg, text, analysis)
    print(f"✅ Nodo creado: {node_path}")


if __name__ == "__main__":
    main()
