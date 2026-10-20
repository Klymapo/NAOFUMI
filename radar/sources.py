"""Fuentes del radar. Cada función devuelve ofertas normalizadas (dict) o lanza una excepción.

Formato normalizado:
  fuente, fuente_nombre, fuente_url, id_externo, url, titulo, empresa, descripcion,
  publicado (ISO UTC o None), tipo (texto o ''), ubicacion (texto), idioma ('en'/'es'/''),
  presupuesto (dict o None), local (bool)
"""
import html
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone

UA = "NAOFUMI-radar/0.1 (+https://github.com/Klymapo/NAOFUMI)"
TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


def get_json(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def plain(text, limit=1500):
    t = html.unescape(TAG_RE.sub(" ", text or ""))
    return WS_RE.sub(" ", t).strip()[:limit]


def iso_from_epoch(value):
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    if v > 1e12:  # milisegundos
        v /= 1000
    return datetime.fromtimestamp(v, timezone.utc).isoformat()


def iso_from_text(value):
    if not value:
        return None
    s = str(value).strip().replace("Z", "+00:00")
    try:
        d = datetime.fromisoformat(s)
    except ValueError:
        return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc).isoformat()


def budget(min_v=None, max_v=None, currency="USD", period="", usd_rate=None):
    def num(x):
        try:
            x = float(x)
            return x if x > 0 else None
        except (TypeError, ValueError):
            return None
    lo, hi = num(min_v), num(max_v)
    if lo is None and hi is None:
        return None
    cur = (currency or "USD").upper()
    rate = usd_rate if usd_rate else (1.0 if cur == "USD" else None)
    return {
        "min": lo, "max": hi, "moneda": cur, "periodo": period or "",
        "usd_min": round(lo * rate, 2) if (lo is not None and rate) else None,
        "usd_max": round(hi * rate, 2) if (hi is not None and rate) else None,
    }


def offer(**kw):
    base = {"fuente": "", "fuente_nombre": "", "fuente_url": "", "id_externo": "", "url": "", "titulo": "",
            "empresa": "", "descripcion": "", "publicado": None, "tipo": "", "ubicacion": "", "idioma": "",
            "presupuesto": None, "local": False, "competencia": None}
    base.update(kw)
    base["titulo"] = plain(base["titulo"], 200)
    base["empresa"] = plain(base["empresa"], 120)
    return base


# ---------------------------------------------------------------- Remotive
def remotive(cfg):
    data = get_json("https://remotive.com/api/remote-jobs")
    out = []
    for j in data.get("jobs", []):
        out.append(offer(
            fuente="remotive", fuente_nombre="Remotive", fuente_url="https://remotive.com",
            id_externo=str(j.get("id", "")), url=j.get("url", ""), titulo=j.get("title", ""),
            empresa=j.get("company_name", ""), descripcion=plain(j.get("description")),
            publicado=iso_from_text(j.get("publication_date")),
            tipo=str(j.get("job_type", "")).replace("_", "-"),
            ubicacion=j.get("candidate_required_location", "") or "",
            idioma="en", presupuesto=None))
    return out


# ---------------------------------------------------------------- Remote OK
def remoteok(cfg):
    data = get_json("https://remoteok.com/api")
    out = []
    for j in data[1:] if isinstance(data, list) else []:
        tags = [str(t).lower() for t in j.get("tags", []) or []]
        tipo = next((t for t in tags if t in ("contract", "freelance", "part time", "part-time")), "")
        out.append(offer(
            fuente="remoteok", fuente_nombre="Remote OK", fuente_url="https://remoteok.com",
            id_externo=str(j.get("id", "")), url=j.get("url", ""), titulo=j.get("position", ""),
            empresa=j.get("company", ""), descripcion=plain(j.get("description")) + " " + " ".join(tags),
            publicado=iso_from_epoch(j.get("epoch")) or iso_from_text(j.get("date")),
            tipo=tipo, ubicacion=j.get("location", "") or "", idioma="en",
            presupuesto=budget(j.get("salary_min"), j.get("salary_max"), "USD", "año")))
    return out


# ---------------------------------------------------------------- Himalayas
def himalayas(cfg):
    out = []
    for offset in range(0, 100, 20):
        data = get_json(f"https://himalayas.app/jobs/api?limit=20&offset={offset}")
        for j in data.get("jobs", []):
            loc = ", ".join(j.get("locationRestrictions") or [])
            per = {"year": "año", "annual": "año", "hour": "hora", "hourly": "hora", "month": "mes"}.get(str(j.get("salaryPeriod", "")).lower(), str(j.get("salaryPeriod", "") or ""))
            out.append(offer(
                fuente="himalayas", fuente_nombre="Himalayas", fuente_url="https://himalayas.app",
                id_externo=str(j.get("guid", "")), url=j.get("applicationLink") or j.get("guid", ""),
                titulo=j.get("title", ""), empresa=j.get("companyName", ""),
                descripcion=plain(j.get("excerpt") or j.get("description")) + " " + " ".join(j.get("categories") or []),
                publicado=iso_from_epoch(j.get("pubDate")), tipo=str(j.get("employmentType", "")),
                ubicacion=loc, idioma="en",
                presupuesto=budget(j.get("minSalary"), j.get("maxSalary"), j.get("currency") or "USD", per)))
        if len(data.get("jobs", [])) < 20:
            break
    return out


# ---------------------------------------------------------------- Jobicy
def jobicy(cfg):
    out, seen = [], set()
    for tag in ("", "excel", "python", "writer", "data"):
        q = "https://jobicy.com/api/v2/remote-jobs?count=50" + (f"&tag={urllib.parse.quote(tag)}" if tag else "")
        data = get_json(q)
        for j in data.get("jobs", []):
            if j.get("id") in seen:
                continue
            seen.add(j.get("id"))
            tipo = ", ".join(j.get("jobType") or []) if isinstance(j.get("jobType"), list) else str(j.get("jobType", ""))
            out.append(offer(
                fuente="jobicy", fuente_nombre="Jobicy", fuente_url="https://jobicy.com",
                id_externo=str(j.get("id", "")), url=j.get("url", ""), titulo=j.get("jobTitle", ""),
                empresa=j.get("companyName", ""),
                descripcion=plain(j.get("jobExcerpt") or j.get("jobDescription")) + " " + " ".join(j.get("jobIndustry") or []),
                publicado=iso_from_text(j.get("pubDate")), tipo=tipo, ubicacion=str(j.get("jobGeo", "")),
                idioma="en",
                presupuesto=budget(j.get("annualSalaryMin"), j.get("annualSalaryMax"), j.get("salaryCurrency") or "USD", "año")))
    return out


# ---------------------------------------------------------------- Freelancer.com
def freelancer(cfg):
    out, seen = [], set()
    for term in cfg.get("freelancer_busquedas", []):
        q = ("https://www.freelancer.com/api/projects/0.1/projects/active/?limit=30&full_description=true"
             f"&sort_field=time_updated&query={urllib.parse.quote(term)}")
        data = get_json(q)
        for p in (data.get("result") or {}).get("projects", []):
            if p.get("id") in seen:
                continue
            seen.add(p.get("id"))
            cur = p.get("currency") or {}
            b = p.get("budget") or {}
            per = "hora" if p.get("type") == "hourly" else "proyecto"
            out.append(offer(
                fuente="freelancer", fuente_nombre="Freelancer.com", fuente_url="https://www.freelancer.com",
                id_externo=str(p.get("id", "")), url="https://www.freelancer.com/projects/" + str(p.get("seo_url", "")),
                titulo=p.get("title", ""), empresa="",
                descripcion=plain(p.get("description") or p.get("preview_description")),
                publicado=iso_from_epoch(p.get("time_submitted")), tipo="freelance " + str(p.get("type", "")),
                ubicacion="remote", idioma=str(p.get("language") or ""), local=bool(p.get("local")),
                competencia=(p.get("bid_stats") or {}).get("bid_count"),
                presupuesto=budget(b.get("minimum"), b.get("maximum"), cur.get("code") or "USD", per, cur.get("exchange_rate"))))
    return out


# ---------------------------------------------------------------- Hacker News
def hn(cfg):
    s = get_json("https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=freelancer&hitsPerPage=1")
    hits = s.get("hits") or []
    if not hits:
        return []
    story = hits[0]["objectID"]
    c = get_json(f"https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_{story}&hitsPerPage=500")
    out = []
    for h in c.get("hits", []):
        text = plain(h.get("comment_text"), 3000)
        if not text.upper().startswith("SEEKING FREELANCER"):
            continue
        first = text.split(".")[0][:140]
        out.append(offer(
            fuente="hn", fuente_nombre="Hacker News · Seeking freelancer", fuente_url="https://news.ycombinator.com",
            id_externo=str(h.get("objectID")), url=f"https://news.ycombinator.com/item?id={h.get('objectID')}",
            titulo=first, empresa=h.get("author", ""), descripcion=text[:1500],
            publicado=iso_from_epoch(h.get("created_at_i")), tipo="freelance", ubicacion="remote" if "REMOTE" in text.upper() else "",
            idioma="en"))
    return out


# ---------------------------------------------------------------- Reddit
def reddit(cfg):
    out = []
    for sub in cfg.get("reddit_subs", []):
        data = get_json(f"https://www.reddit.com/r/{sub}/new.json?limit=50")
        for ch in (data.get("data") or {}).get("children", []):
            p = ch.get("data") or {}
            title = p.get("title", "")
            if "[hiring]" not in title.lower():
                continue
            out.append(offer(
                fuente="reddit", fuente_nombre=f"Reddit r/{sub}", fuente_url=f"https://www.reddit.com/r/{sub}",
                id_externo=str(p.get("id")), url="https://www.reddit.com" + str(p.get("permalink", "")),
                titulo=title, empresa="u/" + str(p.get("author", "")), descripcion=plain(p.get("selftext")),
                publicado=iso_from_epoch(p.get("created_utc")), tipo="freelance", ubicacion="remote", idioma="en"))
    return out


ALL = {"remotive": remotive, "remoteok": remoteok, "himalayas": himalayas, "jobicy": jobicy,
       "freelancer": freelancer, "hn": hn, "reddit": reddit}
