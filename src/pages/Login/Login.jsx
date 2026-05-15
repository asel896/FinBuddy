import React, { useEffect, useRef, useState, useCallback } from "react";
import lottie from "lottie-web";
import { motion, AnimatePresence } from "framer-motion";
import animData from "./octopus.json";
import "./Login.css";
import { useNavigate } from "react-router-dom";
const Login = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const lottieRef1 = useRef(null);
  const lottieRef2 = useRef(null);
  const anim1Ref = useRef(null);
  const anim2Ref = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDiving, setIsDiving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const blinkIntervalRef = useRef(null);
  const isPasswordRef = useRef(false);

  /* ---- PARTICLE OCEAN BG ---- */
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
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));
    let rafId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
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
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(100,255,218,${0.06 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      rafId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  /* ---- LOTTIE ---- */
useEffect(() => {
  const a1 = lottie.loadAnimation({
    container: lottieRef1.current,
    renderer: "svg",
    loop: true,
    autoplay: true,
    animationData: animData,
  });
  const a2 = lottie.loadAnimation({
    container: lottieRef2.current,
    renderer: "svg",
    loop: true,
    autoplay: true,
    animationData: animData,
  });
  a2.addEventListener("DOMLoaded", () => {
    const svg = lottieRef2.current?.querySelector("svg");
    if (svg) svg.style.filter = "hue-rotate(20deg) saturate(1.4)";
  });
  anim1Ref.current = a1;
  anim2Ref.current = a2;
  return () => { a1.destroy(); a2.destroy(); };
}, []);

  /* ---- GÖZ KAPAMA: şifre alanı focus/blur ---- */
  const getActiveAnim = useCallback(() => {
    return isRegistering ? anim2Ref.current : anim1Ref.current;
  }, [isRegistering]);

  const startBlinking = useCallback(() => {
    const anim = getActiveAnim();
    if (!anim) return;
    // Gözleri kapat: frame 14'e git ve orada kal
    anim.pause();
    anim.goToAndStop(14, true);
  }, [getActiveAnim]);

  const stopBlinking = useCallback(() => {
    const anim = getActiveAnim();
    if (!anim) return;
    // Gözleri aç: normal animasyona dön
    anim.goToAndPlay(28, true);
  }, [getActiveAnim]);

  const handlePasswordFocus = useCallback(() => {
    isPasswordRef.current = true;
    setPasswordFocused(true);
    startBlinking();
  }, [startBlinking]);

  const handlePasswordBlur = useCallback(() => {
    isPasswordRef.current = false;
    setPasswordFocused(false);
    stopBlinking();
  }, [stopBlinking]);

  

 const navigate = useNavigate();

const handleDive = () => {
  setIsDiving(true);
  localStorage.setItem("buddyocto_user", "true");
  setTimeout(() => {
    setIsDiving(false);
    navigate("/Dashboard");
  }, 2800);
};
  return (
    <div
      className="scene"
      ref={sceneRef}
   
    >
      <canvas ref={canvasRef} className="bg-canvas" />

      <AnimatePresence>
        {isDiving && (
          <motion.div
            className="dive-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
          >
            <div className="bubble-field">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bbub"
                  style={{
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 15 + 5}px`,
                    height: `${Math.random() * 15 + 5}px`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${Math.random() * 2 + 1}s`,
                    opacity: Math.random() * 0.5,
                  }}
                />
              ))}
            </div>
            <div className="dive-msg">Derinliklere iniliyor...</div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="card"
        animate={isDiving ? { opacity: 0, scale: 0.93 } : { opacity: 1, scale: 1 }}
      >
        <div className={`slide-track ${isRegistering ? "to-register" : ""}`}>

          {/* LOGIN SLIDE */}
          <div className="slide">
            <div className="left">
              <div className="brand-tag">BuddyOcto</div>
              <div ref={lottieRef1} className="lottie-wrap" />
              <div className="left-title">
                Finansal yolculuğuna <br />
                <span>BuddyOcto</span> ile başla.
              </div>
            </div>
            <div className="right">
              <div className="form-header">Hoş Geldin 👋</div>
              <input className="inp" placeholder="E-posta adresi" type="email" />
              <input
                className="inp"
                placeholder="Şifre"
                type="password"
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
              />
              <button className="divebtn" onClick={handleDive}>
                Dalışa Geç
              </button>
              <div className="footer-txt">
                Yeni misin?{" "}
                <span onClick={() => setIsRegistering(true)}>Hesap oluştur</span>
              </div>
            </div>
          </div>

          {/* REGISTER SLIDE */}
          <div className="slide">
            <div className="left">
              <div className="brand-tag">Yeni Mürettebat</div>
              <div ref={lottieRef2} className="lottie-wrap" />
              <div className="left-title">
                Derinlikleri keşfetmek için <br />
                <span>Kayıt Ol</span>.
              </div>
            </div>
            <div className="right">
              <div className="form-header">Hesap Aç ✨</div>
              <input className="inp" placeholder="Ad Soyad" />
              <input className="inp" placeholder="E-posta" type="email" />
              <input
                className="inp"
                placeholder="Şifre"
                type="password"
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
              />
              <button className="divebtn" onClick={handleDive}>
                Mürettebata Katıl
              </button>
              <div className="footer-txt">
                Zaten üye misin?{" "}
                <span onClick={() => setIsRegistering(false)}>Giriş Yap</span>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Login;