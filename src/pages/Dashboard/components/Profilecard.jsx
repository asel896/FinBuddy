import "./ProfileCard.css";

const ProfileCard = ({
  name = "Kullanıcı",
  email = "kullanici@email.com",
  avatarUrl = null,
  monthlyTotal = 0,
  monthlyBudget = 0,
  currency = "₺",
}) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const usagePercent =
    monthlyBudget > 0
      ? Math.min(100, Math.round((monthlyTotal / monthlyBudget) * 100))
      : 0;

  const statusColor =
    usagePercent > 90 ? "#f87171" : usagePercent > 70 ? "#fb923c" : "#4ade80";

  return (
    <div className="profile-card">
      <div className="pc-avatar-wrapper">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="pc-avatar-img" />
        ) : (
          <div className="pc-avatar-initials">{initials}</div>
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