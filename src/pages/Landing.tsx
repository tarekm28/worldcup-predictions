// @ts-nocheck
/* eslint-disable */
// Immersive marketing landing, ported from "new template/the-pool-immersive.html".
// Rendered as a React component: shown to logged-out users as the landing page,
// with a Log in / Sign up call-to-action that opens the auth page.
import { useEffect, useRef } from "react";
import { WC_TROPHY, FLAGS } from "../pool/wcAssets";

const flag = (code: string) => FLAGS[code] || "";

export default function Landing({ onEnter }: { onEnter?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const act = onEnter ?? (() => {});

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const bar = root.querySelector<HTMLElement>(".bar");
    const nav = root.querySelector<HTMLElement>("nav");
    const cglow = root.querySelector<HTMLElement>(".cursor-glow");
    const hero = root.querySelector<HTMLElement>("[data-hero]");
    const story = root.querySelector<HTMLElement>(".story");
    const scenes = [...root.querySelectorAll<HTMLElement>(".scene")];
    const vcards = [...root.querySelectorAll<HTMLElement>(".vcard")];
    const dots = [...root.querySelectorAll<HTMLElement>(".dots i")];
    const twrap = root.querySelector<HTMLElement>(".trophy-wrap");
    const tglow = root.querySelector<HTMLElement>(".tglow");
    const tsheen = root.querySelector<HTMLElement>(".sheen");
    const timg = root.querySelector<HTMLElement>(".trophy-img");

    // tilt + glow on any card
    const cards = [...root.querySelectorAll<HTMLElement>(".glow")];
    const cardHandlers: Array<() => void> = [];
    cards.forEach((card) => {
      const move = (e: PointerEvent) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        if (!reduce && card.classList.contains("tilt"))
          card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 9}deg) rotateY(${(px - 0.5) * 11}deg) translateY(-6px)`;
      };
      const leave = () => { card.style.transform = ""; };
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      cardHandlers.push(() => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); });
    });

    // reveal on scroll
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { root, threshold: 0.15 }
    );
    root.querySelectorAll(".r").forEach((el) => io.observe(el));

    // count up
    let counted = false;
    const counts = () => {
      if (counted) return; counted = true;
      root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = +(el.dataset.count || "0");
        if (reduce) { el.textContent = String(target); return; }
        const dur = 1200, start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          el.textContent = String(Math.round(target * (0.5 - Math.cos(p * Math.PI) / 2)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    };
    const scale = root.querySelector(".scale");
    let scaleObs: IntersectionObserver | null = null;
    if (scale) {
      scaleObs = new IntersectionObserver((es, obs) => {
        if (es.some((e) => e.isIntersecting)) { counts(); obs.disconnect(); }
      }, { root, threshold: 0.3 });
      scaleObs.observe(scale);
    }

    // scroll + pointer loop
    let gmx = 0, gmy = 0, smx = 0, smy = 0, mcx = -999, mcy = -999, raf = 0;
    const onMove = (e: PointerEvent) => {
      gmx = e.clientX / innerWidth - 0.5;
      gmy = e.clientY / innerHeight - 0.5;
      mcx = e.clientX; mcy = e.clientY;
      if (cglow) cglow.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
    };
    addEventListener("pointermove", onMove, { passive: true });

    const loop = () => {
      const vh = root.clientHeight, sy = root.scrollTop;
      if (bar) { const max = root.scrollHeight - vh; bar.style.transform = `scaleX(${max > 0 ? clamp(sy / max, 0, 1) : 0})`; }
      if (nav) nav.classList.toggle("solid", sy > 10);
      if (hero && !reduce) {
        const p = clamp(sy / vh, 0, 1);
        hero.style.opacity = String(1 - p * 0.92);
        hero.style.transform = `translateY(${p * 42}px) scale(${1 - p * 0.04})`;
      }
      if (story && scenes.length && !reduce) {
        const rRect = root.getBoundingClientRect();
        const sRect = story.getBoundingClientRect();
        const topInScroll = sRect.top - rRect.top + sy;
        const prog = clamp((sy - topInScroll) / (story.offsetHeight - vh), 0, 1);
        const idx = Math.min(scenes.length - 1, Math.floor(prog * scenes.length));
        scenes.forEach((s, i) => s.classList.toggle("on", i === idx));
        vcards.forEach((s, i) => s.classList.toggle("on", i === idx));
        dots.forEach((d, i) => d.classList.toggle("on", i === idx));
      }
      smx += (gmx - smx) * 0.06; smy += (gmy - smy) * 0.06;
      if (twrap && !reduce) twrap.style.transform = `rotateX(${-smy * 13}deg) rotateY(${smx * 16}deg)`;
      if (timg && tsheen) {
        const r = timg.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dist = Math.hypot(mcx - cx, mcy - cy);
        const near = clamp(1 - dist / 440, 0, 1);
        if (tglow) tglow.style.opacity = String(0.26 + near * 0.5);
        tsheen.style.opacity = String(near * 0.8);
        tsheen.style.setProperty("--sx", clamp((mcx - r.left) / r.width, 0, 1) * 100 + "%");
        tsheen.style.setProperty("--sy", clamp((mcy - r.top) / r.height, 0, 1) * 100 + "%");
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      io.disconnect();
      scaleObs?.disconnect();
      cardHandlers.forEach((off) => off());
    };
  }, []);

  const handleEnter = (e?: React.MouseEvent) => { e?.preventDefault(); act(); };
  const scrollTo = (sel: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    rootRef.current?.querySelector(sel)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="tpl" ref={rootRef}>
      <style>{CSS}</style>

      <div className="cursor-glow" />
      <div className="bar" />

      <nav>
        <div className="nav-in">
          <div className="brand"><span className="dot" />The Pool</div>
          <a href="#" className="nav-cta" onClick={handleEnter}>Log in / Sign up</a>
        </div>
      </nav>

      <header className="hero">
        <div data-hero>
          <div className="eyebrow r">FIFA World Cup 2026</div>
          <div className="trophy-wrap">
            <div className="tglow" />
            <img className="trophy-img" src={WC_TROPHY} alt="FIFA World Cup trophy" />
            <div className="sheen" style={{ WebkitMaskImage: `url(${WC_TROPHY})`, maskImage: `url(${WC_TROPHY})` }} />
          </div>
          <h1 className="r">Predict the whole<br />tournament.</h1>
          <p className="lead r">A private prediction game for you and your friends. Call every scoreline, climb one table, settle it by the final.</p>
          <div className="cta-row r">
            <a href="#" className="btn btn-p" onClick={handleEnter}>Log in / Sign up</a>
            <a href="#" className="btn btn-t" onClick={scrollTo(".story")}>See how it works ↓</a>
          </div>
        </div>
        <div className="cue" />
      </header>

      <section className="story">
        <div className="stage"><div className="stage-in">
          <div className="scene-track">
            <div className="scene"><div className="step-k">Step one</div><h2>Make your call.</h2><p>Enter a scoreline for every fixture while it's still open. Change your mind as often as you like — until kickoff.</p></div>
            <div className="scene"><div className="step-k">Step two</div><h2>It locks itself.</h2><p>The moment the match starts, your pick freezes and vanishes from everyone else's view. Enforced in the database, not just on screen.</p></div>
            <div className="scene"><div className="step-k">Step three</div><h2>The big reveal.</h2><p>At full time every prediction is unveiled side by side. No edits, no peeking — just who actually called it.</p></div>
            <div className="scene"><div className="step-k">Step four</div><h2>Points settle in.</h2><p>Exact score is worth five, the right result three. Scores sync in and the table updates on its own.</p></div>
          </div>
          <div className="viz">
            <div className="vcard"><div className="app tilt glow">
              <div className="k">Group D · Matchday 1</div>
              <div className="m-row" style={{ marginTop: 12, justifyContent: "space-between" }}><div className="m-row"><img className="flag" src={flag("us")} alt="" /><span className="tname">USA</span></div><div className="m-row"><span className="tname">Paraguay</span><img className="flag" src={flag("py")} alt="" /></div></div>
              <div className="pickbox"><div className="m-row" style={{ justifyContent: "space-between" }}><span style={{ color: "var(--cyan)", fontWeight: 600, fontSize: 13 }}>Your pick</span><div className="m-row"><span className="step-in">2</span><span style={{ color: "var(--mut2)" }}>:</span><span className="step-in">1</span></div></div></div>
            </div></div>
            <div className="vcard"><div className="app tilt glow">
              <div className="k">Group D · Matchday 1</div>
              <div className="m-row" style={{ marginTop: 12, justifyContent: "space-between" }}><div className="m-row"><img className="flag" src={flag("us")} alt="" /><span className="tname">USA</span></div><div className="m-row"><span className="tname">Paraguay</span><img className="flag" src={flag("py")} alt="" /></div></div>
              <div className="pickbox" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ fontWeight: 600, fontSize: 13 }}>Locked · kickoff</span><span style={{ display: "flex", gap: 6 }}><span className="av" style={{ background: "#86868b" }}>M</span><span className="av" style={{ background: "#86868b" }}>L</span><span className="av" style={{ background: "#86868b" }}>S</span></span></div>
            </div></div>
            <div className="vcard"><div className="app tilt glow">
              <div className="k">Full time</div>
              <div className="m-row" style={{ marginTop: 10, justifyContent: "space-between" }}><div className="m-row"><img className="flag" src={flag("us")} alt="" /><span className="tname">USA</span></div><div className="sc">2 – 1</div><img className="flag" src={flag("py")} alt="" /></div>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}><div className="lbr"><span className="av" style={{ background: "var(--gold)" }}>YOU</span>You<span style={{ marginLeft: "auto", fontWeight: 700 }}>2–1</span></div><div className="lbr"><span className="av" style={{ background: "var(--cyan)" }}>MA</span>Maya<span style={{ marginLeft: "auto", fontWeight: 700 }}>1–1</span></div><div className="lbr"><span className="av" style={{ background: "#a78bfa" }}>LE</span>Leo<span style={{ marginLeft: "auto", fontWeight: 700 }}>3–0</span></div></div>
            </div></div>
            <div className="vcard"><div className="app tilt glow">
              <div className="k">Points awarded</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 9 }}><div className="lbr"><span className="av" style={{ background: "var(--gold)" }}>YOU</span>You<span className="chip x5" style={{ marginLeft: "auto" }}>+5 EXACT</span></div><div className="lbr"><span className="av" style={{ background: "var(--cyan)" }}>MA</span>Maya<span className="chip x3" style={{ marginLeft: "auto" }}>+3 RESULT</span></div><div className="lbr"><span className="av" style={{ background: "#a78bfa" }}>LE</span>Leo<span className="k" style={{ marginLeft: "auto" }}>+0</span></div></div>
              <div className="pickbox" style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ fontWeight: 600, fontSize: 13 }}>You take the lead</span><span style={{ fontWeight: 700, fontSize: 20, color: "var(--cyan)" }}>38</span></div>
            </div></div>
          </div>
          <div className="dots"><i /><i /><i /><i /></div>
        </div></div>
      </section>

      <section className="feat"><div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 120 }}>
        <div className="frow">
          <div className="ftext r"><div className="eyebrow">Fair by design</div><h2 style={{ marginTop: 12 }}>Hidden until the whistle.</h2><p className="lead">Nobody sees anybody's scoreline until a match locks. The rules live in the database, so they can't be bent — not by the app, not by anyone.</p></div>
          <div className="fviz r"><div className="panel tilt glow">
            <div className="k" style={{ marginBottom: 14 }}>Tonight's picks</div>
            <div className="lbr"><span className="av" style={{ background: "var(--cyan)" }}>MA</span>Maya<span style={{ marginLeft: "auto", color: "var(--mut2)" }}>🔒 hidden</span></div>
            <div className="lbr"><span className="av" style={{ background: "#a78bfa" }}>LE</span>Leo<span style={{ marginLeft: "auto", color: "var(--mut2)" }}>🔒 hidden</span></div>
            <div className="lbr"><span className="av" style={{ background: "#f2a65a" }}>SA</span>Sam<span style={{ marginLeft: "auto", color: "var(--mut2)" }}>🔒 hidden</span></div>
            <div className="lbr"><span className="av" style={{ background: "var(--gold)" }}>YOU</span>You<span style={{ marginLeft: "auto", fontWeight: 700 }}>2 – 1</span></div>
          </div></div>
        </div>
        <div className="frow rev">
          <div className="ftext r"><div className="eyebrow">The bragging rights</div><h2 style={{ marginTop: 12 }}>One table.<br />All summer long.</h2><p className="lead">Every exact call is five points, every right result three. By the final, the standings tell the whole story of who really knows their football.</p></div>
          <div className="fviz r"><div className="panel tilt glow">
            <div className="lbr" style={{ padding: "9px 0", fontWeight: 700 }}><span className="av" style={{ background: "var(--gold)" }}>YOU</span>You<span style={{ marginLeft: "auto", fontSize: 20 }}>38</span></div>
            <div className="lbr" style={{ padding: "9px 0" }}><span className="av" style={{ background: "var(--cyan)" }}>MA</span>Maya<span style={{ marginLeft: "auto", fontWeight: 700 }}>34</span></div>
            <div className="lbr" style={{ padding: "9px 0" }}><span className="av" style={{ background: "#a78bfa" }}>LE</span>Leo<span style={{ marginLeft: "auto", fontWeight: 700 }}>29</span></div>
            <div className="lbr" style={{ padding: "9px 0" }}><span className="av" style={{ background: "#f2a65a" }}>SA</span>Sam<span style={{ marginLeft: "auto", fontWeight: 700 }}>25</span></div>
          </div></div>
        </div>
        <div className="frow">
          <div className="ftext r"><div className="eyebrow">Start to finish</div><h2 style={{ marginTop: 12 }}>Groups, all the way to the cup.</h2><p className="lead">Twelve group tables, the full Round of 32 bracket, and the trophy waiting in the middle. Predict every step of the road to the final.</p></div>
          <div className="fviz r"><div className="panel tilt glow" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 230 }}>
            <img className="draw-trophy" src={WC_TROPHY} alt="World Cup trophy" style={{ height: 140, width: "auto", filter: "drop-shadow(0 10px 20px rgba(0,0,0,.5))" }} />
          </div></div>
        </div>
      </div></section>

      <section className="scale"><div className="wrap">
        <div className="eyebrow r">USA · Canada · Mexico</div>
        <h2 className="big r" style={{ marginTop: 14 }}>The biggest one ever.</h2>
        <div className="snum">
          <div className="r"><div className="n"><span data-count="48">48</span></div><div className="l">nations</div></div>
          <div className="r"><div className="n"><span data-count="104">104</span></div><div className="l">matches to call</div></div>
          <div className="r"><div className="n">1</div><div className="l">champion</div></div>
        </div>
      </div></section>

      <section className="cta"><div className="wrap">
        <div className="tw r"><img className="draw-trophy" src={WC_TROPHY} alt="World Cup trophy" style={{ height: 100, width: "auto" }} /></div>
        <h2 className="big r">Your pool is waiting.</h2>
        <p className="lead r" style={{ margin: "18px auto 34px", maxWidth: 480 }}>Spin one up, share the code, and let the trash talk begin.</p>
        <a href="#" className="btn btn-p r" style={{ fontSize: 17, padding: "15px 32px" }} onClick={handleEnter}>Log in / Sign up</a>
      </div></section>

      <footer><div className="wrap foot"><div className="brand" style={{ fontSize: 15 }}><span className="dot" />The Pool</div><div>Built for friends · World Cup 2026</div></div></footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.tpl{
  --bg:#0A0C26; --surf:rgba(255,255,255,.05); --line:rgba(255,255,255,.10); --line2:rgba(255,255,255,.18);
  --txt:#EAEBFA; --mut:#9DA0D8; --mut2:#6E72B0; --cyan:#22E0DE; --violet:#8B5CF6; --magenta:#EC2C8E; --lime:#C9F213; --gold:#E8B84B;
  --spring:cubic-bezier(.2,1.6,.3,1);
  position:fixed; inset:0; z-index:1000; overflow-x:hidden; overflow-y:auto; scroll-behavior:smooth;
  -webkit-font-smoothing:antialiased; line-height:1.5; color:var(--txt);
  font-family:'Inter',system-ui,sans-serif; background:var(--bg);
  background-image:radial-gradient(900px 600px at 80% -5%,rgba(236,44,142,.16),transparent 55%),radial-gradient(900px 650px at 10% 8%,rgba(139,92,246,.18),transparent 52%),radial-gradient(1000px 820px at 50% 118%,rgba(34,224,222,.08),transparent 60%);
}
.tpl *{box-sizing:border-box;margin:0;padding:0}
.tpl .wrap{max-width:1080px;margin:0 auto;padding:0 28px}
.tpl h1,.tpl h2,.tpl h3{letter-spacing:-.028em;font-weight:600;line-height:1.05}
.tpl .eyebrow{font-weight:600;font-size:13px;color:var(--cyan)}
.tpl .lead{font-size:clamp(1.05rem,1.7vw,1.32rem);color:var(--mut);font-weight:400;line-height:1.55}
.tpl .big{font-size:clamp(2.1rem,5.4vw,4rem);font-weight:600}

.tpl-close{position:fixed;top:14px;right:16px;z-index:120;width:38px;height:38px;border-radius:50%;border:1px solid var(--line2);background:rgba(7,7,8,.6);backdrop-filter:blur(10px);color:var(--txt);font-size:16px;cursor:pointer;transition:transform .3s var(--spring),background .3s}
.tpl-close:hover{transform:scale(1.08);background:rgba(7,7,8,.85)}

.tpl .cursor-glow{position:fixed;top:0;left:0;width:560px;height:560px;margin:-280px 0 0 -280px;border-radius:50%;
  background:radial-gradient(circle,rgba(34,224,222,.10),transparent 62%);pointer-events:none;z-index:1;will-change:transform}
.tpl .bar{position:fixed;top:0;left:0;height:2px;width:100%;transform:scaleX(0);transform-origin:0;background:var(--cyan);z-index:90}
.tpl nav{position:fixed;inset:0 0 auto;z-index:80;transition:background .5s,backdrop-filter .5s,border-color .5s;border-bottom:1px solid transparent}
.tpl nav.solid{background:rgba(7,7,8,.7);backdrop-filter:saturate(160%) blur(18px);border-bottom:1px solid var(--line)}
.tpl .nav-in{display:flex;align-items:center;padding:15px 28px;max-width:1080px;margin:0 auto}
.tpl .brand{display:flex;align-items:center;gap:9px;font-weight:600;font-size:16px}
.tpl .brand .dot{width:10px;height:10px;border-radius:50%;background:var(--cyan)}
.tpl .nav-cta{margin-left:auto;font-size:14px;font-weight:500;color:#16210a;background:var(--lime);padding:8px 16px;border-radius:999px;text-decoration:none;cursor:pointer;transition:transform .4s var(--spring)}
.tpl .nav-cta:hover{transform:translateY(-2px) scale(1.04)}

.tpl .btn{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-weight:500;font-size:16px;padding:13px 26px;border-radius:999px;cursor:pointer;transition:transform .5s var(--spring),opacity .3s}
.tpl .btn-p{background:var(--lime);color:#16210a}.tpl .btn-p:hover{transform:translateY(-3px) scale(1.04)}
.tpl .btn-t{color:var(--cyan)}.tpl .btn-t:hover{opacity:.7}

.tpl section{position:relative;z-index:2}

.tpl .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:90px 28px 40px}
.tpl [data-hero]{will-change:transform,opacity}
.tpl .trophy-wrap{position:relative;width:min(290px,66vw);margin:2px auto 12px;perspective:1000px;animation:tplbob 6s ease-in-out infinite}
@keyframes tplbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.tpl .trophy-img{display:block;width:100%;height:auto;filter:drop-shadow(0 22px 38px rgba(0,0,0,.6));transition:transform .35s var(--spring),filter .25s ease;will-change:transform,filter}
.tpl .tglow{position:absolute;inset:-14% -12%;border-radius:50%;background:radial-gradient(circle,rgba(232,184,75,.55),transparent 60%);filter:blur(30px);opacity:.26;transition:opacity .25s ease;z-index:-1}
.tpl .sheen{position:absolute;inset:0;pointer-events:none;opacity:0;mix-blend-mode:screen;mask-size:contain;mask-repeat:no-repeat;mask-position:center;-webkit-mask-size:contain;-webkit-mask-repeat:no-repeat;-webkit-mask-position:center;background:radial-gradient(150px circle at var(--sx,50%) var(--sy,50%),rgba(255,255,255,.92),transparent 56%)}
.tpl .hero h1{font-size:clamp(2.4rem,7vw,4.6rem);font-weight:700}
.tpl .hero .lead{margin-top:18px;max-width:560px}
.tpl .cta-row{margin-top:32px;display:flex;gap:22px;justify-content:center;align-items:center;flex-wrap:wrap}
.tpl .cue{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);width:22px;height:34px;border:1.5px solid var(--line2);border-radius:14px}
.tpl .cue::after{content:"";position:absolute;top:6px;left:50%;width:3px;height:7px;border-radius:2px;margin-left:-1.5px;background:var(--mut);animation:tplcue 1.7s ease-in-out infinite}
@keyframes tplcue{0%{transform:translateY(0);opacity:1}60%{transform:translateY(11px);opacity:0}100%{opacity:0}}

.tpl .story{height:420vh;position:relative}
.tpl .stage{position:sticky;top:0;height:100vh;display:flex;align-items:center;overflow:hidden}
.tpl .stage-in{width:100%;max-width:1080px;margin:0 auto;padding:0 28px;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
.tpl .scene-track{position:relative;min-height:420px}
.tpl .scene{position:absolute;inset:0;opacity:0;transform:translateY(28px);transition:opacity .5s ease,transform .6s var(--spring);will-change:transform,opacity}
.tpl .scene.on{opacity:1;transform:none}
.tpl .scene .step-k{font-size:13px;font-weight:600;color:var(--cyan);margin-bottom:14px}
.tpl .scene h2{font-size:clamp(1.8rem,3.4vw,2.7rem)}
.tpl .scene p{margin-top:14px;color:var(--mut);font-size:1.05rem;max-width:420px}
.tpl .viz{position:relative;min-height:420px}
.tpl .vcard{position:absolute;inset:0;opacity:0;transform:translateY(28px) scale(.97);transition:opacity .5s ease,transform .6s var(--spring);will-change:transform,opacity;display:flex;align-items:center;justify-content:center}
.tpl .vcard.on{opacity:1;transform:none}
.tpl .dots{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);display:flex;gap:9px;z-index:5}
.tpl .dots i{width:6px;height:6px;border-radius:50%;background:var(--line2);transition:.3s;display:block}
.tpl .dots i.on{background:var(--cyan);width:20px;border-radius:3px}

.tpl .app{width:300px;background:#0e0f11;border:1px solid var(--line);border-radius:22px;padding:18px;box-shadow:0 40px 90px -40px rgba(0,0,0,.9)}
.tpl .m-row{display:flex;align-items:center;gap:10px}
.tpl .flag{width:26px;height:19px;object-fit:cover;border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.12);flex-shrink:0}
.tpl .flag.s{width:18px;height:13px}
.tpl .tname{font-weight:600;font-size:13px}
.tpl .sc{font-weight:700;font-size:26px;letter-spacing:-.02em}
.tpl .k{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mut2)}
.tpl .pickbox{margin-top:16px;background:#16181b;border-radius:12px;padding:13px}
.tpl .step-in{display:flex;align-items:center;justify-content:center;width:30px;height:34px;border-radius:8px;background:#0e0f11;font-weight:700;font-size:18px}
.tpl .chip{font-weight:700;font-size:11px;padding:3px 9px;border-radius:999px}
.tpl .x5{background:var(--lime);color:#16210a}.tpl .x3{background:var(--cyan);color:#052524}
.tpl .av{width:22px;height:22px;border-radius:50%;font-weight:700;font-size:10px;display:grid;place-items:center;color:#06160c}
.tpl .lbr{display:flex;align-items:center;gap:9px;padding:6px 0;font-size:13px;font-weight:500}

.tpl .feat{padding:120px 0}
.tpl .frow{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.tpl .frow.rev .ftext{order:2}
.tpl .ftext h2{font-size:clamp(1.8rem,3.6vw,2.9rem)}.tpl .ftext p{margin-top:18px}
.tpl .fviz{display:flex;justify-content:center;will-change:transform}
.tpl .panel{width:100%;max-width:380px;background:var(--surf);border:1px solid var(--line);border-radius:24px;padding:22px}

.tpl .tilt{transition:transform .5s var(--spring);transform-style:preserve-3d}
.tpl .glow{position:relative;overflow:hidden}
.tpl .glow::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .35s;
  background:radial-gradient(240px circle at var(--mx,50%) var(--my,50%),rgba(34,224,222,.16),transparent 60%)}
.tpl .glow:hover::before{opacity:1}
.tpl .glow::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .35s;
  border:1px solid transparent;background:radial-gradient(300px circle at var(--mx,50%) var(--my,50%),rgba(34,224,222,.5),transparent 45%) border-box;
  -webkit-mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.tpl .glow:hover::after{opacity:.7}

.tpl .scale{padding:130px 0;text-align:center}
.tpl .snum{display:flex;justify-content:center;gap:clamp(28px,6vw,80px);flex-wrap:wrap;margin-top:10px}
.tpl .snum .n{font-size:clamp(2.6rem,6vw,4.4rem);font-weight:700;letter-spacing:-.03em}
.tpl .snum .l{color:var(--mut);font-size:14px;margin-top:6px}

.tpl .cta{padding:150px 0;text-align:center}
.tpl .tw{width:96px;height:96px;margin:0 auto 24px;position:relative;display:grid;place-items:center}

.tpl footer{border-top:1px solid var(--line);padding:36px 0;color:var(--mut2);font-size:13px}
.tpl .foot{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}

.tpl .r{opacity:0;transform:translateY(44px) scale(.96);transition:opacity .7s ease,transform .9s var(--spring)}
.tpl .r.in{opacity:1;transform:none}

@media (max-width:820px){
  .tpl .stage-in,.tpl .frow{grid-template-columns:1fr;gap:28px}.tpl .frow.rev .ftext{order:0}
  .tpl .scene-track,.tpl .viz{min-height:360px}.tpl .story{height:360vh}
  .tpl .cursor-glow{display:none}
}
@media (prefers-reduced-motion:reduce){
  .tpl{scroll-behavior:auto}
  .tpl .story{height:auto}.tpl .stage{position:static;height:auto;padding:80px 0}.tpl .scene-track,.tpl .viz{min-height:0}
  .tpl .scene,.tpl .vcard{position:static;opacity:1!important;transform:none!important;margin-bottom:30px}
  .tpl .r{opacity:1!important;transform:none!important;transition:none}.tpl .cue::after,.tpl .trophy-wrap{animation:none}
}
`;
