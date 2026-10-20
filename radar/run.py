"""Corrida diaria del radar: consulta fuentes, filtra y escribe data/ofertas.json.

Uso: python radar/run.py [--salida data] [--muestras carpeta_con_json_por_fuente]
"""
import argparse
import json
import sys
import time
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import filters  # noqa: E402
import sources  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent


def load_json(path, default):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--salida", default=str(ROOT / "data"))
    ap.add_argument("--muestras", help="Carpeta con <fuente>.json ya normalizados (pruebas sin red)")
    args = ap.parse_args(argv)

    cfg = load_json(Path(__file__).parent / "config.json", {})
    out_dir = Path(args.salida)
    out_dir.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc)

    estado, crudas = [], []
    for name, fn in sources.ALL.items():
        if not cfg.get("fuentes", {}).get(name, False):
            continue
        t0 = time.time()
        try:
            items = load_json(Path(args.muestras) / f"{name}.json", []) if args.muestras else fn(cfg)
            estado.append({"fuente": name, "estado": "ok", "recibidas": len(items), "error": None})
            crudas.extend(items)
        except Exception as e:  # una fuente caída no detiene a las demás
            estado.append({"fuente": name, "estado": "falló", "recibidas": 0, "error": f"{type(e).__name__}: {e}"[:300]})
        estado[-1]["segundos"] = round(time.time() - t0, 1)

    descartes, aceptadas = Counter(), []
    for o in crudas:
        motivo, enr = filters.evaluate(o, cfg, now)
        if motivo:
            descartes[motivo] += 1
        else:
            aceptadas.append(enr)
    aceptadas = filters.dedupe(aceptadas)[: cfg.get("max_ofertas", 60)]

    hist_path = out_dir / "historial.json"
    hist = load_json(hist_path, {})
    corte = (now - timedelta(days=30)).isoformat()
    hist = {k: v for k, v in hist.items() if v >= corte}
    for o in aceptadas:
        o["descubierto"] = hist.get(o["id"], now.isoformat())
        o["nueva"] = o["id"] not in hist
        hist.setdefault(o["id"], o["descubierto"])
        o["descripcion"] = o["descripcion"][:600]

    for e in estado:
        e["aceptadas"] = sum(1 for o in aceptadas if o["fuente"] == e["fuente"])

    doc = {
        "version": 1,
        "generado": now.isoformat(),
        "ventana_horas": cfg["ventana_horas"],
        "fuentes": estado,
        "descartes": dict(descartes.most_common()),
        "total_revisadas": len(crudas),
        "ofertas": aceptadas,
        "aviso": "Ofertas públicas filtradas automáticamente. Revisa la fuente original antes de postular; ninguna se ha verificado manualmente.",
    }
    (out_dir / "ofertas.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    hist_path.write_text(json.dumps(hist, ensure_ascii=False, indent=0), encoding="utf-8")
    ok = sum(1 for e in estado if e["estado"] == "ok")
    print(f"Fuentes ok: {ok}/{len(estado)} · revisadas: {len(crudas)} · aceptadas: {len(aceptadas)}")
    for e in estado:
        print(f"  {e['fuente']:<10} {e['estado']:<6} {e['recibidas']:>4} → {e['aceptadas']:>3}  {e['error'] or ''}")
    print("Descartes:", dict(descartes.most_common(8)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
