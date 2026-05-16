import "./ProfileCard.css";
import defaultLogo from "../../../assets/logo.webp";
const ProfileCard = ({
  name = "Kullanıcı",
  email = "kullanici@email.com",
  avatarUrl = null,
  monthlyTotal = 0,
  monthlyBudget = 0,
  currency = "₺",
}) => {
  const usagePercent =
    monthlyBudget > 0
      ? Math.min(100, Math.round((monthlyTotal / monthlyBudget) * 100))
      : 0;

  const statusColor =
    usagePercent > 90 ? "#f87171" : usagePercent > 70 ? "#fb923c" : "#4ade80";

  return (
    <div className="profile-card">
      <div className="pc-avatar-wrapper">
        {/* Avatar: önce avatarUrl, yoksa logo, yoksa initials */}
        {avatarUrl ? (
  <img src={avatarUrl} alt={name} className="pc-avatar-img" />
) : (
  <img
    src={defaultLogo} // Değişen satır: string yerine import edilen değişken
    alt="BuddyOcto"
    className="pc-avatar-img pc-avatar-logo"
  />
)}
        <div className="pc-status-dot" style={{ background: statusColor }} />
      </div>

      <div className="pc-info">
        <h3 className="pc-name">{name}</h3>
        <p className="pc-email">{email}</p>
      </div>

      <div className="pc-divider" />

      <div className="pc-summary">
        <div className="pc-summary-row">
          <span className="pc-label">Bu ay harcandı</span>
          <span className="pc-value" style={{ color: statusColor }}>
            {currency}{monthlyTotal.toLocaleString("tr-TR")}
          </span>
        </div>
        {monthlyBudget > 0 && (
          <>
            <div className="pc-summary-row">
              <span className="pc-label">Bütçe</span>
              <span className="pc-value">
                {currency}{monthlyBudget.toLocaleString("tr-TR")}
              </span>
            </div>
            <div className="pc-bar-bg">
              <div
                className="pc-bar-fill"
                style={{ width: `${usagePercent}%`, background: statusColor }}
              />
            </div>
            <p className="pc-bar-label">Bütçenin %{usagePercent}'i kullanıldı</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;