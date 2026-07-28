import numpy as np
from sklearn.ensemble import IsolationForest


class FraudDetector:
    """Anomaly detection for fraudulent transactions using Isolation Forest."""

    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42,
        )
        self.is_fitted = False

    def _extract_features(self, data: dict) -> np.ndarray:
        """Convert transaction data to feature vector."""
        features = [
            float(data.get("amount", 0)),
            float(data.get("failed_attempts_last_hour", 0)),
            1.0 if data.get("is_new_user", False) else 0.0,
            float(data.get("shipping_distance", 0) or 0) / 10000.0,
        ]
        return np.array(features).reshape(1, -1)

    def fit(self, transaction_history: list[dict]):
        """Train the model on historical transaction data."""
        if len(transaction_history) < 10:
            return

        X = np.array([self._extract_features(t).flatten() for t in transaction_history])
        self.model.fit(X)
        self.is_fitted = True

    def predict(self, transaction: dict) -> tuple[float, bool, list[str]]:
        """
        Returns (risk_score, is_fraudulent, risk_factors).
        risk_score: 0.0 (safe) to 1.0 (fraudulent)
        """
        risk_factors = []
        score = 0.0

        amount = float(transaction.get("amount", 0))
        if amount > 5000:
            risk_factors.append("High transaction amount")
            score += 0.3
        if amount > 10000:
            score += 0.2

        if transaction.get("is_new_user", False):
            risk_factors.append("New user account")
            score += 0.2

        failed = int(transaction.get("failed_attempts_last_hour", 0))
        if failed > 3:
            risk_factors.append(f"Multiple failed attempts ({failed})")
            score += 0.2

        if self.is_fitted:
            features = self._extract_features(transaction)
            anomaly_score = self.model.score_samples(features)[0]
            normalized = 1.0 / (1.0 + np.exp(-anomaly_score))
            score = 0.5 * score + 0.5 * normalized

        score = min(1.0, max(0.0, score))
        is_fraudulent = score > 0.6

        return score, is_fraudulent, risk_factors


fraud_detector = FraudDetector()
