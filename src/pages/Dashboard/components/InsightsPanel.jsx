import React from "react";
import "./InsightsPanel.css";
import LottieIcon from "./LottieIcon"; 
import animAngry from "../animations/angry.json";
import animSmile from "../animations/smile.json";
import animMoney from "../animations/money.json";
import animStats from "../animations/stats.json";

const InsightsPanel = () => {
  return (
    <div className="tab-panel">
      <div className="tab-header">
        <div>
          <h2>Psikolojik Finans Analizi</h2>
          <p>Duygularınla harcamaların arasındaki ilişki</p>
        </div>
      </div>

      <div className="insight-grid">
        <div className="insight-card red">
          <div className="insight-icon">
            <LottieIcon animationData={animAngry} size={36} />
          </div>
          <div className="insight-title">Stresli Günler</div>
          <div className="insight-val">+%43</div>
          <div className="insight-desc">Stresli olduğunda ortalama harcaman %43 artıyor</div>
        </div>

        <div className="insight-card green">
          <div className="insight-icon">
            <LottieIcon animationData={animSmile} size={36} />
          </div>
          <div className="insight-title">Mutlu Günler</div>
          <div className="insight-val">-220 TL</div>
          <div className="insight-desc">Mutlu olduğunda daha bilinçli alışveriş yapıyorsun</div>
        </div>

        <div className="insight-card purple">
          <div className="insight-icon">
            <LottieIcon animationData={animMoney} size={36} />
          </div>
          <div className="insight-title">Kahve Bağımlılığı</div>
          <div className="insight-val">680 TL/ay</div>
          <div className="insight-desc">Aylık kahve harcaman bir iPhone'un %4.5'i</div>
        </div>

        <div className="insight-card blue">
          <div className="insight-icon">
            <LottieIcon animationData={animStats} size={36} />
          </div>
          <div className="insight-title">Gece Alışverişi</div>
          <div className="insight-val">%67</div>
          <div className="insight-desc">Harcamaların %67'si saat 21:00 sonrası yapılıyor</div>
        </div>
      </div>

      <div className="prediction-card">
        <div className="prediction-title">
          <LottieIcon animationData={animStats} size={22} autoplay />
          {" "}Bu Ay Tahmini
        </div>
        <div className="prediction-text">
          Mevcut harcama temponla bu ayı <strong>3.840 TL</strong> ile kapatacaksın. Bütçeni{" "}
          <strong>840 TL</strong> aşacaksın. Kahve ve dışarıda yemek harcamalarını kısarsan farkı
          kapatabilirsin.
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;