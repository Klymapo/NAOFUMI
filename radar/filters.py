"""Filtros en cascada y puntaje. Reglas deterministas: nada de IA ni datos inventados."""
import hashlib
import re
from datetime import datetime, timezone


def norm(text):
    return re.sub(r"\s+", " ", (text or "").lower())


def contains_term(hay, term):
    """Coincidencia por palabra completa para términos cortos; subcadena para frases."""
    t = term.lower()
    if len(t) <= 4 and t.isalnum():
        return re.search(rf"(?<![a-z0-9]){re.escape(t)}(?![a-z0-9])", hay) is not None
    return t in hay


def oid(o):
    key = (o.get("url") or "").split("?")[0].rstrip("/").lower() or f"{o.get('fuente')}:{o.get('id_externo')}"
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]


def title_key(o):
    return norm(f"{o.get('titulo')}|{o.get('empresa')}")


def age_hours(o, now):
    if not o.get("publicado"):
        return None
    d = datetime.fromisoformat(o["publicado"])
    return (now - d).total_seconds() / 3600


def match_lines(o, cfg):
    title = norm(o.get("titulo"))
    body = norm(o.get("descripcion"))
    found = {}
    for line, spec in cfg["lineas"].items():
        score, hits = 0, []
        for term in spec.get("fuertes", []):
            if contains_term(title, term):
                score += 6; hits.append(term)
            elif contains_term(body, term):
                score += 2; hits.append(term)
        for term in spec.get("debiles", []):
            if contains_term(title, term):
                score += 2; hits.append(term)
            elif contains_term(body, term):
                score += 0.5; hits.append(term)
        if score >= 2.5:
            found[line] = (score, sorted(set(hits))[:8])
    return found


def evaluate(o, cfg, now=None):
    """Devuelve (motivo_descartada | None, oferta_enriquecida)."""
    now = now or datetime.now(timezone.utc)
    text = norm(f"{o.get('titulo')} {o.get('descripcion')}")
    loc = norm(o.get("ubicacion"))
    tipo = norm(o.get("tipo"))

    age = age_hours(o, now)
    if age is None:
        return "sin fecha verificable", o
    if age > cfg["ventana_horas"]:
        return f"más de {cfg['ventana_horas']} h", o
    if age < -2:
        return "fecha en el futuro", o

    if o.get("local"):
        return "trabajo local, no remoto", o
    if any(contains_term(text, t) or contains_term(loc, t) for t in cfg["remoto_excluir"]):
        return "no es 100 % remoto", o
    if loc.strip(" .") not in ("", "remote", "remoto") and not any(a in loc for a in cfg["ubicaciones_permitidas"]):
        return "restringida a otra región", o

    if not any(t in tipo for t in cfg["tipos_permitidos"]):
        return "empleo, no freelance", o

    if o.get("idioma") and o["idioma"] not in cfg["idiomas"]:
        return "idioma fuera de español/inglés", o

    bad = [t for t in cfg["lista_negra"] if contains_term(text, t)]
    if bad:
        return f"lista negra ({bad[0]})", o

    minimo = cfg.get("minimos_por_fuente", {}).get(o.get("fuente"))
    b = o.get("presupuesto")
    if minimo and b:
        top = b.get("usd_max") or b.get("usd_min")
        limite = minimo.get("hora_usd") if b.get("periodo") == "hora" else minimo.get("proyecto_usd")
        if top is not None and limite and top < limite:
            return f"bajo el mínimo de {o.get('fuente_nombre') or o.get('fuente')}", o

    lines = match_lines(o, cfg)
    if not lines:
        return "no encaja con el catálogo", o

    best = max(lines.items(), key=lambda kv: kv[1][0])
    conv = conveniencia(o, cfg, best, len(lines), age, text)
    reasons = [f"Encaja con {best[0]}: {', '.join(best[1][1][:4])}"] + [f["detalle"] for f in conv["factores"][1:] if f.get("detalle")]

    enriched = dict(o)
    enriched.update({
        "id": oid(o),
        "lineas": sorted(lines, key=lambda k: -lines[k][0]),
        "categoria_app": cfg["lineas"][best[0]]["categoria_app"],
        "coincidencias": best[1][1],
        "puntaje": conv["valor"],
        "conveniencia": conv,
        "motivos": reasons,
        "edad_horas": round(age, 1),
    })
    return None, enriched


def _fee(cfg, fuente, amount, periodo):
    spec = cfg.get("comisiones", {}).get(fuente)
    if not spec or amount is None:
        return 0.0
    fee = amount * spec.get("porcentaje", 0) / 100
    if periodo == "proyecto":
        fee = max(fee, spec.get("minimo_usd", 0))
    return fee


def conveniencia(o, cfg, best, n_lines, age, text):
    """Índice 0-100 de conveniencia de postular. Transparente: cada factor dice cuánto aporta.
    No es probabilidad de ganar el proyecto."""
    F = []
    enc = round(min(best[1][0], 24) / 24 * 35 + (2 if n_lines > 1 else 0))
    F.append({"nombre": "Encaje con tu catálogo", "puntos": min(enc, 35), "max": 35, "detalle": ""})

    fr = 15 if age <= 24 else 9 if age <= 48 else 4
    F.append({"nombre": "Frescura", "puntos": fr, "max": 15, "detalle": f"Publicada hace {round(age)} h"})

    b = o.get("presupuesto")
    top = (b.get("usd_max") or b.get("usd_min")) if b else None
    if top:
        neto = top - _fee(cfg, o.get("fuente"), top, b.get("periodo"))
        if b.get("periodo") == "hora":
            pg = 25 if neto >= 25 else 18 if neto >= 15 else 10 if neto >= 10 else 3
            det = f"Pago neto estimado ≈ US${neto:.0f}/h"
        elif b.get("periodo") == "proyecto":
            pg = 25 if neto >= 300 else 18 if neto >= 150 else 12 if neto >= 75 else 6 if neto >= 40 else 2
            det = f"Pago neto estimado ≈ US${neto:.0f} por proyecto (tope del rango, menos comisión)"
        else:
            pg, det = 12, f"Sueldo publicado ({b.get('periodo') or 'periodo sin indicar'})"
    else:
        pg, det = 8, "Sin presupuesto publicado"
    F.append({"nombre": "Pago", "puntos": pg, "max": 25, "detalle": det})

    costo = cfg.get("nota_postulacion", {}).get(o.get("fuente"))
    F.append({"nombre": "Costo de postular", "puntos": 7 if costo else 15, "max": 15,
              "detalle": costo or "Postulación directa, sin costo"})

    bids = o.get("competencia")
    if bids is None:
        cp, det = 5, "Competencia desconocida"
    else:
        cp = 10 if bids <= 10 else 6 if bids <= 25 else 3 if bids <= 50 else 0
        det = f"{bids} propuestas enviadas hasta ahora"
    F.append({"nombre": "Competencia", "puntos": cp, "max": 10, "detalle": det})

    ajuste = 0
    if any(contains_term(norm(o.get("titulo")), t) for t in cfg["penalizar"]["senior"]):
        ajuste -= 15; F.append({"nombre": "Pide perfil senior", "puntos": -15, "max": 0, "detalle": "Pide perfil senior"})
    if o.get("idioma") == "es" or "spanish" in text or "español" in text:
        ajuste += 5; F.append({"nombre": "Valora español", "puntos": 5, "max": 0, "detalle": "Valora español (ventaja tuya)"})

    valor = max(0, min(100, sum(f["puntos"] for f in F)))
    u = cfg.get("umbrales_conveniencia", {"conviene": 70, "revisar": 45})
    dictamen = "Conviene" if valor >= u["conviene"] else "Revisar" if valor >= u["revisar"] else "No conviene"
    return {"valor": valor, "dictamen": dictamen, "factores": F}


def dedupe(offers):
    seen_id, seen_title, out = set(), set(), []
    for o in sorted(offers, key=lambda x: -x["puntaje"]):
        k1, k2 = o["id"], title_key(o)
        if k1 in seen_id or k2 in seen_title:
            continue
        seen_id.add(k1); seen_title.add(k2); out.append(o)
    return out
