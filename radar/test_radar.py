"""Pruebas del radar sin red. Ejecutar: python -m unittest radar/test_radar.py"""
import json
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import filters  # noqa: E402
import run  # noqa: E402
import sources  # noqa: E402

CFG = json.loads((Path(__file__).parent / "config.json").read_text(encoding="utf-8"))
NOW = datetime(2026, 10, 20, 15, 0, tzinfo=timezone.utc)


def mk(**kw):
    base = dict(fuente="t", fuente_nombre="Prueba", url="https://x.test/1", titulo="Power BI dashboard for sales team",
                empresa="ACME", descripcion="Need an Excel and Power BI dashboard. Remote.", tipo="freelance",
                ubicacion="", idioma="en", presupuesto=None, local=False,
                publicado=(NOW - timedelta(hours=5)).isoformat())
    base.update(kw)
    return sources.offer(**base)


def why(o):
    return filters.evaluate(o, CFG, NOW)[0]


class Filtros(unittest.TestCase):
    def test_acepta_oferta_valida(self):
        motivo, o = filters.evaluate(mk(), CFG, NOW)
        self.assertIsNone(motivo)
        self.assertEqual(o["lineas"][0], "Datos y BI")
        self.assertEqual(o["categoria_app"], "Datos y Excel")
        self.assertGreater(o["puntaje"], 0)

    def test_antigua(self):
        self.assertIn("72", why(mk(publicado=(NOW - timedelta(hours=80)).isoformat())))

    def test_sin_fecha(self):
        self.assertEqual(why(mk(publicado=None)), "sin fecha verificable")

    def test_no_remoto(self):
        self.assertEqual(why(mk(descripcion="Hybrid role, 3 days in office")), "no es 100 % remoto")
        self.assertEqual(why(mk(local=True)), "trabajo local, no remoto")

    def test_region(self):
        self.assertEqual(why(mk(ubicacion="USA Only")), "restringida a otra región")
        self.assertEqual(why(mk(ubicacion="Europe")), "restringida a otra región")
        self.assertIsNone(why(mk(ubicacion="Worldwide")))
        self.assertIsNone(why(mk(ubicacion="LATAM")))
        self.assertIsNone(why(mk(ubicacion="Remote")))

    def test_empleo(self):
        self.assertEqual(why(mk(tipo="full-time")), "empleo, no freelance")
        self.assertEqual(why(mk(tipo="part-time")), "empleo, no freelance")
        self.assertIsNone(why(mk(tipo="Contractor")))

    def test_idioma(self):
        self.assertEqual(why(mk(idioma="pt")), "idioma fuera de español/inglés")

    def test_lista_negra(self):
        self.assertTrue(why(mk(descripcion="Unpaid internship, Excel dashboard")).startswith("lista negra"))
        self.assertTrue(why(mk(titulo="Crypto presale dashboard")).startswith("lista negra"))

    def test_fuera_de_catalogo(self):
        self.assertEqual(why(mk(titulo="Plumber needed", descripcion="Fix pipes")), "no encaja con el catálogo")

    def test_termino_corto_por_palabra(self):
        # 'kpi' no debe activarse dentro de otra palabra; 'sql' solo como palabra
        self.assertEqual(why(mk(titulo="Logo design", descripcion="skpitch mysqlite branding")), "no encaja con el catálogo")

    def test_narrativa(self):
        motivo, o = filters.evaluate(mk(titulo="Game writer for branching dialogue", descripcion="Visual novel project"), CFG, NOW)
        self.assertIsNone(motivo)
        self.assertEqual(o["categoria_app"], "Narrativa y guion")

    def test_presupuesto_bajo_baja_conveniencia(self):
        _, alto = filters.evaluate(mk(presupuesto=sources.budget(30, 40, "USD", "hora")), CFG, NOW)
        _, bajo = filters.evaluate(mk(presupuesto=sources.budget(3, 5, "USD", "hora")), CFG, NOW)
        self.assertGreater(alto["puntaje"], bajo["puntaje"])
        self.assertEqual(alto["puntaje"], alto["conveniencia"]["valor"])

    def test_conveniencia_descuenta_comision_y_costo(self):
        fl = dict(fuente="freelancer", fuente_nombre="Freelancer.com")
        _, directo = filters.evaluate(mk(presupuesto=sources.budget(60, 80, "USD", "proyecto")), CFG, NOW)
        _, puja = filters.evaluate(mk(presupuesto=sources.budget(60, 80, "USD", "proyecto"), **fl), CFG, NOW)
        pago = next(f for f in puja["conveniencia"]["factores"] if f["nombre"] == "Pago")
        self.assertIn("US$72", pago["detalle"])  # 80 - 10 % (8) = 72
        self.assertGreater(directo["puntaje"], puja["puntaje"])

    def test_conveniencia_competencia_y_dictamen(self):
        fl = dict(fuente="freelancer", fuente_nombre="Freelancer.com", presupuesto=sources.budget(300, 500, "USD", "proyecto"))
        _, pocas = filters.evaluate(mk(competencia=3, **fl), CFG, NOW)
        _, muchas = filters.evaluate(mk(competencia=80, **fl), CFG, NOW)
        self.assertGreater(pocas["puntaje"], muchas["puntaje"])
        for o in (pocas, muchas):
            c = o["conveniencia"]
            self.assertTrue(0 <= c["valor"] <= 100)
            self.assertIn(c["dictamen"], ("Conviene", "Revisar", "No conviene"))
            self.assertEqual(c["valor"], max(0, min(100, sum(f["puntos"] for f in c["factores"]))))

    def test_senior_baja_puntaje(self):
        _, jr = filters.evaluate(mk(), CFG, NOW)
        _, sr = filters.evaluate(mk(titulo="Senior Power BI dashboard consultant"), CFG, NOW)
        self.assertLess(sr["puntaje"], jr["puntaje"])

    def test_minimo_freelancer(self):
        fl = dict(fuente="freelancer", fuente_nombre="Freelancer.com")
        self.assertEqual(why(mk(presupuesto=sources.budget(10, 30, "USD", "proyecto"), **fl)), "bajo el mínimo de Freelancer.com")
        self.assertEqual(why(mk(presupuesto=sources.budget(3, 8, "USD", "hora"), **fl)), "bajo el mínimo de Freelancer.com")
        motivo, o = filters.evaluate(mk(presupuesto=sources.budget(100, 250, "USD", "proyecto"), **fl), CFG, NOW)
        self.assertIsNone(motivo)
        self.assertTrue(any("6 pujas" in m for m in o["motivos"]))
        # otras fuentes no tienen mínimo duro
        self.assertIsNone(why(mk(presupuesto=sources.budget(10, 30, "USD", "proyecto"))))

    def test_dedupe(self):
        a = filters.evaluate(mk(), CFG, NOW)[1]
        b = filters.evaluate(mk(url="https://x.test/1?utm=1"), CFG, NOW)[1]
        c = filters.evaluate(mk(url="https://otra.test/9"), CFG, NOW)[1]  # mismo título y empresa
        self.assertEqual(len(filters.dedupe([a, b, c])), 1)


class Normalizadores(unittest.TestCase):
    def patch(self, payloads):
        calls = iter(payloads)
        orig = sources.get_json
        sources.get_json = lambda url, timeout=30: next(calls)
        self.addCleanup(setattr, sources, "get_json", orig)

    def test_freelancer_convierte_moneda(self):
        self.patch([{"status": "success", "result": {"projects": [{
            "id": 7, "title": "Excel dashboard", "seo_url": "excel/dash", "description": "<p>Need Excel</p>",
            "time_submitted": int(NOW.timestamp()), "type": "fixed", "language": "en", "local": False,
            "budget": {"minimum": 1500, "maximum": 3000}, "currency": {"code": "INR", "exchange_rate": 0.0105}}]}}])
        o = sources.freelancer({"freelancer_busquedas": ["excel"]})[0]
        self.assertEqual(o["url"], "https://www.freelancer.com/projects/excel/dash")
        self.assertEqual(o["presupuesto"]["usd_max"], 31.5)
        self.assertEqual(o["descripcion"], "Need Excel")

    def test_remoteok_salta_aviso_legal(self):
        self.patch([[{"legal": "API Terms"}, {"id": 1, "position": "Data analyst", "company": "X", "epoch": int(NOW.timestamp()),
                      "tags": ["contract", "excel"], "location": "", "url": "https://remoteok.com/1", "salary_min": 0}]])
        r = sources.remoteok({})
        self.assertEqual(len(r), 1)
        self.assertEqual(r[0]["tipo"], "contract")
        self.assertIsNone(r[0]["presupuesto"])

    def test_hn_solo_seeking_freelancer(self):
        self.patch([{"hits": [{"objectID": "99"}]},
                    {"hits": [{"objectID": "1", "comment_text": "SEEKING FREELANCER | Excel dashboards | REMOTE", "created_at_i": int(NOW.timestamp()), "author": "a"},
                              {"objectID": "2", "comment_text": "SEEKING WORK | me", "created_at_i": int(NOW.timestamp()), "author": "b"}]}])
        r = sources.hn({})
        self.assertEqual([x["id_externo"] for x in r], ["1"])

    def test_reddit_solo_hiring(self):
        self.patch([{"data": {"children": [{"data": {"id": "a", "title": "[Hiring] Excel help", "permalink": "/r/forhire/a", "created_utc": NOW.timestamp(), "author": "x", "selftext": ""}},
                                           {"data": {"id": "b", "title": "[For Hire] Me", "permalink": "/r/forhire/b", "created_utc": NOW.timestamp()}}]}}])
        r = sources.reddit({"reddit_subs": ["forhire"]})
        self.assertEqual(len(r), 1)


class Corrida(unittest.TestCase):
    def test_corrida_con_muestras_y_fuente_caida(self):
        with tempfile.TemporaryDirectory() as tmp:
            muestras, salida = Path(tmp, "m"), Path(tmp, "out")
            muestras.mkdir()
            fresh = datetime.now(timezone.utc) - timedelta(hours=3)
            (muestras / "remotive.json").write_text(json.dumps([mk(publicado=fresh.isoformat()), mk(url="https://x.test/2", titulo="Plumber", descripcion="pipes", publicado=fresh.isoformat())]))
            # sin archivo para el resto: load_json devuelve [] y la corrida sigue
            run.main(["--salida", str(salida), "--muestras", str(muestras)])
            doc = json.loads((salida / "ofertas.json").read_text())
            self.assertEqual(len(doc["ofertas"]), 1)
            self.assertTrue(doc["ofertas"][0]["nueva"])
            self.assertEqual(doc["descartes"].get("no encaja con el catálogo"), 1)
            run.main(["--salida", str(salida), "--muestras", str(muestras)])
            doc2 = json.loads((salida / "ofertas.json").read_text())
            self.assertFalse(doc2["ofertas"][0]["nueva"])
            self.assertEqual(doc2["ofertas"][0]["descubierto"], doc["ofertas"][0]["descubierto"])


if __name__ == "__main__":
    unittest.main()
