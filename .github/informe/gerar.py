"""Fila do informe del sueno (Alden 19/11): roda no GitHub Actions.

1. le os envios de WhatsApp em `aguardando_pdf` (wa_envios, quiz de insonia);
2. busca a resposta e o modelo do quiz, desenha o PDF com informe.py;
3. sobe para o bucket PRIVADO `informes` e gera um link assinado de 14 dias;
4. chama `informe_pronto`, que libera a mensagem para o despachante da Mih.

Nada pessoal vai para o log: so o id da resposta. Dado de saude.
Uso: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python gerar.py [response_id]
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
import urllib.request
from pathlib import Path

from informe import html_do_informe, imprimir

URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_KEY"]
BUCKET = "informes"
VALIDADE = 14 * 24 * 3600


def pedir(metodo: str, caminho: str, corpo=None, tipo="application/json", extra=None):
    dados = None
    if corpo is not None:
        dados = corpo if isinstance(corpo, bytes) else json.dumps(corpo).encode()
    h = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": tipo}
    h.update(extra or {})
    req = urllib.request.Request(URL + caminho, data=dados, headers=h, method=metodo)
    with urllib.request.urlopen(req, timeout=60) as r:
        txt = r.read()
    return json.loads(txt) if txt else None


def pendentes(so: str | None) -> list[str]:
    q = "/rest/v1/wa_envios?status=eq.aguardando_pdf&select=response_id"
    if so:
        q += f"&response_id=eq.{so}"
    return sorted({x["response_id"] for x in pedir("GET", q)})


def gerar(resp_id: str, navegador, pasta: Path) -> None:
    r = pedir("GET", f"/rest/v1/quiz_responses?id=eq.{resp_id}"
                     "&select=contact_name,answers,duracao,quiz_id")[0]
    esq = pedir("GET", f"/rest/v1/quiz_templates?id=eq.{r['quiz_id']}&select=schema")[0]["schema"]
    if not r.get("duracao"):
        raise ValueError("resposta sem duracao")
    respostas = {k: v for k, v in (r["answers"] or {}).items() if isinstance(v, int)}
    nome = (r.get("contact_name") or "").strip().split(" ")[0].capitalize()
    html = html_do_informe(nome, r["duracao"], respostas, esq)
    pdf = pasta / f"{resp_id}.pdf"
    imprimir(html, pdf, navegador)
    pedir("POST", f"/storage/v1/object/{BUCKET}/{resp_id}.pdf", pdf.read_bytes(),
          tipo="application/pdf", extra={"x-upsert": "true"})
    s = pedir("POST", f"/storage/v1/object/sign/{BUCKET}/{resp_id}.pdf", {"expiresIn": VALIDADE})
    link = URL + "/storage/v1" + s["signedURL"]
    n = pedir("POST", "/rest/v1/rpc/informe_pronto", {"p_response": resp_id, "p_url": link})
    print(f"ok {resp_id} ({n} envio liberado)")


def main() -> int:
    so = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else None
    ids = pendentes(so)
    if not ids:
        print("nada aguardando")
        return 0
    from playwright.sync_api import sync_playwright
    falhas = 0
    with tempfile.TemporaryDirectory() as d, sync_playwright() as p:
        # CHROMIUM_PATH so para teste local (macOS 13 sem Chromium do Playwright novo)
        nav = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
        for rid in ids:
            try:
                gerar(rid, nav, Path(d))
            except Exception as e:          # uma resposta ruim nao trava as outras
                falhas += 1
                print(f"falhou {rid}: {type(e).__name__}")
        nav.close()
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
