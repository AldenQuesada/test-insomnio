"""Informe del sueno em PDF, gerado na nuvem do GitHub a cada resposta do quiz de insonia.

Copia do ~/instituto-quiz/pdf/informe.py (Alden 19/11): mesmo desenho, mesmas contas, mesmos
textos (todos de quiz_templates.schema.pdf_es). Este arquivo so desenha; quem busca a fila,
sobe o PDF e avisa o WhatsApp e o gerar.py.
"""
from __future__ import annotations

import datetime as dt
from pathlib import Path

NOTURNAS = ("q1a", "q1b", "q1c")
DIURNAS = ("q2", "q3", "q4", "q5")


# ── contas ───────────────────────────────────────────────────────────

def faixa_de(nota: int, faixas: list) -> dict:
    for f in faixas:
        if f["de"] <= nota <= f["ate"]:
            return f
    return faixas[-1]


def leitura(respostas: dict, duracao: str, perguntas: list) -> dict:
    """Só o que foi medido. Nada é somado entre escalas diferentes e nada é
    ponderado: a versão anterior convertia a duração em pontos com
    multiplicadores que eu escolhi, sem fonte nenhuma."""
    nota = sum(v for k, v in respostas.items()
               if isinstance(v, int) and any(p["id"] == k and p.get("pontua")
                                             for p in perguntas))
    clase = ""
    for p in perguntas:
        if p["id"] == "dur":
            for o in p.get("opcoes_es", []):
                if o["valor"] == duracao:
                    clase = o["clase"]
    return {"nota": nota,
            "noturna": sum(respostas.get(k, 0) for k in NOTURNAS),
            "impacto_bruto": sum(respostas.get(k, 0) for k in DIURNAS),
            "clase": clase}


# ── desenho ──────────────────────────────────────────────────────────

def svg_perfil(respostas: dict, perguntas: list, cores: list) -> str:
    """Barra por item do ISI. A forma do perfil diz mais que a altura total."""
    itens = [p for p in perguntas if p.get("pontua")]
    # O passo tem que caber rótulo MAIS barra: com 38 o rótulo de uma linha
    # encostava na barra da linha anterior.
    alt, passo, larg = 26, 56, 560
    linhas = []
    for i, p in enumerate(itens):
        v = respostas.get(p["id"], 0)
        y = i * passo
        cor = cores[min(v, len(cores) - 1)]
        linhas.append(
            f'<text x="0" y="{y + 12}" class="rot">{p["rotulo_es"]}</text>'
            f'<rect x="0" y="{y + 22}" width="{larg}" height="{alt}" rx="6" class="trilho"/>'
            f'<rect x="0" y="{y + 22}" width="{max(10, v / 4 * larg)}" height="{alt}" rx="6" fill="{cor}"/>'
            f'<text x="{max(10, v / 4 * larg) - 12}" y="{y + 22 + alt - 8}" class="val">{v}</text>')
    h = len(itens) * passo + 10
    return (f'<svg viewBox="0 0 {larg} {h}" width="100%" height="{h}">'
            + "".join(linhas) + "</svg>")


def svg_mapa(noturna: int, impacto: int, quads: dict, atual: str) -> str:
    """Carga nocturna (0-12) contra impacto diurno (0-16), quatro quadrantes.

    O primeiro desenho tinha quatro retângulos quase da mesma cor, sem nome e
    sem eixo escrito: bonito e ilegível. Aqui cada quadrante se identifica, o
    dela fica aceso e os eixos dizem o que medem.

    As linhas-guia existem porque quem cai EM CIMA da divisória, que é onde cai
    muita gente, via um ponto solto entre dois quadrantes sem saber a qual dos
    dois pertencia."""
    w, h = 560, 400
    me, md, mt, mb = 74, 16, 16, 52              # margens do desenho
    pw, ph = w - me - md, h - mt - mb
    cx, cy = me + pw / 2, mt + ph / 2
    px = me + noturna / 12 * pw
    py = (mt + ph) - impacto / 16 * ph

    # chave → retângulo e onde cai o nome. O nome vai para o canto de FORA de
    # cada quadrante: no meio ele fica embaixo do ponto e das linhas-guia, que
    # é justo onde cai quem tem carga repartida.
    casas = {
        "baixo_alto":  (me, mt, me + 12, mt + 22, "start"),
        "alto_alto":   (cx, mt, me + pw - 12, mt + 22, "end"),
        "baixo_baixo": (me, cy, me + 12, mt + ph - 14, "start"),
        "alto_baixo":  (cx, cy, me + pw - 12, mt + ph - 14, "end"),
    }
    partes = []
    for k, (x, y, tx, ty, anc) in casas.items():
        aceso = k == atual
        partes.append(
            f'<rect x="{x}" y="{y}" width="{pw/2}" height="{ph/2}" '
            f'class="{"q aceso" if aceso else "q"}"/>'
            f'<text x="{tx}" y="{ty}" text-anchor="{anc}" '
            f'class="{"qn aceso-t" if aceso else "qn"}">{quads[k]["nome"]}</text>')

    return f'''<svg viewBox="0 0 {w} {h}" width="100%" height="{h}">
  {"".join(partes)}
  <line x1="{me}" y1="{mt}" x2="{me}" y2="{mt+ph}" class="eixo"/>
  <line x1="{me}" y1="{mt+ph}" x2="{me+pw}" y2="{mt+ph}" class="eixo"/>
  <line x1="{me}" y1="{py}" x2="{px}" y2="{py}" class="guia"/>
  <line x1="{px}" y1="{mt+ph}" x2="{px}" y2="{py}" class="guia"/>
  <circle cx="{px}" cy="{py}" r="24" class="halo"/>
  <circle cx="{px}" cy="{py}" r="11" class="ponto"/>
  <text x="{px+20}" y="{py-16}" class="aqui">{noturna} · {impacto}</text>
  <text x="{me-10}" y="{mt+ph+4}" class="tick fim">0</text>
  <text x="{me-10}" y="{mt+10}" class="tick fim">16</text>
  <text x="{me+pw}" y="{mt+ph+22}" class="tick fim">12</text>
  <text x="{me}" y="{mt+ph+22}" class="tick">0</text>
  <text x="{me+pw/2}" y="{h-8}" class="eixo-t meio">CARGA NOCTURNA</text>
  <text transform="translate(22,{mt+ph/2}) rotate(-90)" class="eixo-t meio">IMPACTO DIURNO</text>
</svg>'''


def svg_matriz(faixa: str, clase: str, faixas_es: list, clases: dict) -> str:
    """Faixas do ISI contra fases de tempo. Duas classificações com corte
    publicado, cruzadas. Nenhum peso, nenhuma soma entre escalas."""
    cols = ["agudo", "subagudo", "cronico"]
    linhas = list(reversed(faixas_es))            # a mais grave em cima
    w, h = 560, 300
    me, mt, mb = 150, 30, 34
    cw = (w - me) / len(cols)
    ch = (h - mt - mb) / len(linhas)
    partes = []
    for j, c in enumerate(cols):
        partes.append(f'<text x="{me + cw*(j+0.5)}" y="{mt-10}" class="qn meio">'
                      f'{clases[c]["nome"]}</text>')
    for i, f in enumerate(linhas):
        y = mt + i * ch
        partes.append(f'<text x="{me-14}" y="{y + ch/2 + 4}" class="qn fim">'
                      f'{f["rotulo"]}</text>')
        for j, c in enumerate(cols):
            aceso = (f["codigo"] == faixa and c == clase)
            partes.append(
                f'<rect x="{me + j*cw}" y="{y}" width="{cw}" height="{ch}" '
                f'class="{"cel aceso" if aceso else "cel"}"'
                + (f' style="fill:{f["cor"]}"' if aceso else '') + '/>')
    return (f'<svg viewBox="0 0 {w} {h}" width="100%" height="{h}">'
            + "".join(partes) +
            f'<text x="{me + (w-me)/2}" y="{h-6}" class="eixo-t meio">TIEMPO</text>'
            '</svg>')


def html_do_informe(nome: str, duracao: str, respostas: dict, esq: dict) -> str:
    T = esq["pdf_es"]
    perguntas = esq["perguntas"]
    r = leitura(respostas, duracao, perguntas)
    fx = faixa_de(r["nota"], esq["faixas"])
    fx_es = next(x for x in esq["faixas_es"] if x["codigo"] == fx["codigo"])

    pior = max(((p, respostas.get(p["id"], 0)) for p in perguntas if p.get("pontua")),
               key=lambda t: t[1])
    quad = ("alto" if r["noturna"] > 6 else "baixo") + "_" + \
           ("alto" if r["impacto_bruto"] > 8 else "baixo")
    q = T["p3_quadrantes"][quad]

    hoje = dt.date.today().strftime("%d/%m/%Y")
    cores = ["#4a5568", "#7f8a9c", "#b9a05a", "#e2a04a", "#d1553f"]

    modelo = (Path(__file__).parent / "informe.html").read_text(encoding="utf-8")
    html = modelo.format(
        marca=T["marca"], titulo=T["titulo"], subtitulo=T["subtitulo"],
        rodape=T["rodape"],
        preparado=T["preparado"] % (nome or "ti", hoje),
        nome=nome, nota=r["nota"], faixa=fx_es["titulo"], faixa_cor=fx_es["cor"],
        p2_titulo=T["p2_titulo"], p2_texto=T["p2_texto"],
        p2_pico=T["p2_pico"] % pior[0]["rotulo_es"],
        grafico_perfil=svg_perfil(respostas, perguntas, cores),
        p3_titulo=T["p3_titulo"], p3_texto=T["p3_texto"],
        p3_eixo_x=T["p3_eixo_x"], p3_eixo_y=T["p3_eixo_y"],
        quad_nome=q["nome"], quad_texto=q["texto"],
        grafico_mapa=svg_mapa(r["noturna"], r["impacto_bruto"],
                              T["p3_quadrantes"], quad),
        noturna=r["noturna"], impacto=r["impacto_bruto"],
        p4_titulo=T["p4_titulo"], p4_texto=T["p4_texto"],
        clase_nome=T["p4_clases"][r["clase"]]["nome"],
        clase_texto=T["p4_clases"][r["clase"]]["texto"],
        grafico_matriz=svg_matriz(fx["codigo"], r["clase"],
                                  esq["faixas_es"], T["p4_clases"]),
        p5_titulo=T["p5_titulo"], p5_nota=T["p5_nota"],
        p5_blocos="".join(
            f'<div class="dado"><div class="dado-n">{b["dado"]}</div>'
            f'<p>{b["texto"]}</p></div>' for b in T["p5_blocos"]),
        p6_titulo=T["p6_titulo"], p6_texto=T["p6_texto"], p6_botao=T["p6_botao"],
        r_gravidade=T["p6_resumo"]["gravidade"], r_tempo=T["p6_resumo"]["tempo"],
        r_peso=T["p6_resumo"]["peso"],
        v_gravidade=fx_es["titulo"], v_tempo=T["p4_clases"][r["clase"]]["nome"],
        v_peso=pior[0]["rotulo_es"],
        cta_url=esq["resultado_cta"]["url"])

    return html


def imprimir(html: str, saida: Path, navegador) -> None:
    tmp = saida.with_suffix(".html")
    tmp.write_text(html, encoding="utf-8")
    pg = navegador.new_page()
    pg.goto(tmp.as_uri(), wait_until="networkidle")
    pg.wait_for_timeout(1200)          # deixa a Fraunces chegar
    pg.pdf(path=str(saida), format="A4", print_background=True,
           margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
    pg.close()
    tmp.unlink(missing_ok=True)
