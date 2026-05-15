import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Login.css";

const Login = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDiving, setIsDiving] = useState(false);

  /* -------------------- PARTICLE OCEAN BG -------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = scene.offsetWidth;
      canvas.height = scene.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = [];
    const NUM = 80;

    for (let i = 0; i < NUM; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,255,218,${p.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(100,255,218,${
              0.06 * (1 - dist / 90)
            })`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(draw);
    };

    draw();
    return () => window.removeEventListener("resize", resize);
  }, []);

  const handleDive = () => {
    setIsDiving(true);
    setTimeout(() => setIsDiving(false), 2800);
  };

  return (
    <div
      className="scene"
      ref={sceneRef}
      onMouseMove={(e) =>
        setMousePos({ x: e.clientX, y: e.clientY })
      }
    >
      <canvas ref={canvasRef} className="bg-canvas" />

      {/* DIVE SCREEN */}
      <AnimatePresence>
        {isDiving && (
          <motion.div
            className="dive-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bubble-field">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bbub"
                  style={{
                    width: `${10 + i * 3}px`,
                    height: `${10 + i * 3}px`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            <div className="dive-msg">
              Derinliklere iniliyor...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CARD */}
      <motion.div
        className="card"
        animate={isDiving ? { opacity: 0, y: -20 } : { opacity: 1 }}
      >
        {/* LEFT */}
        <div className="left">
          <div className="brand-tag">BuddyOcto</div>

          <div className="octo-body">
            <div className="eyes">
              {[1, 2].map((i) => (
                <div key={i} className="eye">
                  <div
                    className="pupil"
                    style={{
                      transform: `translate(-50%,-50%) translate(${
                        (mousePos.x - window.innerWidth / 2) / 80
                      }px,${
                        (mousePos.y - window.innerHeight / 2) / 80
                      }px)`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="left-title">
            Finansal yolculuğuna <br />
            <span>BuddyOcto</span> ile başla.
          </div>
        </div>

        {/* RIGHT */}
        <div className="right">
          <div>
            <div className="form-header">Hoş Geldin</div>
            <div className="form-sub">
              Mürettebata katıl ve bütçeni yönet.
            </div>
          </div>

          <input className="inp" placeholder="E-posta adresi" />
          <input className="inp" type="password" placeholder="Şifre" />

          <button className="divebtn" onClick={handleDive}>
            <div className="shine" />
            Dalışa Geç
          </button>

          <div className="footer-txt">
            Yeni misin? <span>Hesap oluştur</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;