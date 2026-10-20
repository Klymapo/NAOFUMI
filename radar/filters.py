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

    lines = match_lines(o, cfg)
    if not lines:
        return "no encaja con el catálogo", o

    reasons, score = [], 0.0
    best = max(lines.items(), key=lambda kv: kv[1][0])
    score += min(best[1][0], 24)
    reasons.append(f"Encaja con {best[0]}: {', '.join(best[1][1][:4])}")
    if len(lines) > 1:
        score += 2
    if age <= 24:
        score += 4; reasons.append("Publicada hace menos de 24 h")
    elif age <= 48:
        score += 2
    b = o.get("presupuesto")
    pen = cfg["penalizar"]
    if b and (b.get("usd_max") or b.get("usd_min")):
        top = b.get("usd_max") or b.get("usd_min")
        low = (b["periodo"] == "hora" and top < pen["presupuesto_bajo_usd_hora"]) or \
              (b["periodo"] == "proyecto" and top < pen["presupuesto_bajo_usd_fijo"])
        if low:
            score -= 6; reasons.append("Presupuesto bajo")
        else:
            score += 3; reasons.append("Presupuesto publicado")
    else:
        reasons.append("Sin presupuesto publicado")
    if any(contains_term(norm(o.get("titulo")), t) for t in pen["senior"]):
        score -= 5; reasons.append("Pide perfil senior")
    if o.get("idioma") == "es" or "spanish" in text or "español" in text:
        score += 3; reasons.append("Valora español")

    enriched = dict(o)
    enriched.update({
        "id": oid(o),
        "lineas": sorted(lines, key=lambda k: -lines[k][0]),
        "categoria_app": cfg["lineas"][best[0]]["categoria_app"],
        "coincidencias": best[1][1],
        "puntaje": round(score, 1),
        "motivos": reasons,
        "edad_horas": round(age, 1),
    })
    return None, enriched


def dedupe(offers):
    seen_id, seen_title, out = set(), set(), []
    for o in sorted(offers, key=lambda x: -x["puntaje"]):
        k1, k2 = o["id"], title_key(o)
        if k1 in seen_id or k2 in seen_title:
            continue
        seen_id.add(k1); seen_title.add(k2); out.append(o)
    return out
