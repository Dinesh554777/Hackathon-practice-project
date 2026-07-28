import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta


class DemandForecaster:
    """Simple demand forecasting using linear regression on historical sales."""

    def __init__(self):
        self.models: dict[str, LinearRegression] = {}
        self.product_history: dict[str, list[dict]] = {}

    def add_sales_data(self, product_id: str, sales_history: list[dict]):
        """
        sales_history: list of {"date": "2025-01-01", "quantity": 10}
        """
        self.product_history[product_id] = sales_history
        self._train(product_id)

    def _train(self, product_id: str):
        if product_id not in self.product_history:
            return

        history = self.product_history[product_id]
        if len(history) < 5:
            return

        X, y = [], []
        base_date = datetime.strptime(history[0]["date"], "%Y-%m-%d")
        for entry in history:
            date = datetime.strptime(entry["date"], "%Y-%m-%d")
            days_diff = (date - base_date).days
            X.append([days_diff])
            y.append(entry["quantity"])

        model = LinearRegression()
        model.fit(np.array(X), np.array(y))
        self.models[product_id] = model

    def forecast(self, product_id: str, days: int = 30) -> tuple[list[dict], str]:
        """
        Returns (predictions, trend).
        predictions: list of {"day": n, "predicted_quantity": float}
        """
        if product_id not in self.models:
            return [], "insufficient_data"

        model = self.models[product_id]
        history = self.product_history.get(product_id, [])
        base_date = datetime.strptime(history[0]["date"], "%Y-%m-%d") if history else datetime.now()
        last_day = (datetime.strptime(history[-1]["date"], "%Y-%m-%d") - base_date).days if history else 0

        predictions = []
        for d in range(1, days + 1):
            day_num = last_day + d
            qty = max(0, int(round(model.predict([[day_num]])[0])))
            predictions.append({
                "day": d,
                "date": (base_date + timedelta(days=day_num)).strftime("%Y-%m-%d"),
                "predicted_quantity": qty,
            })

        trend = "up" if model.coef_[0] > 0.1 else ("down" if model.coef_[0] < -0.1 else "stable")
        return predictions, trend


forecaster = DemandForecaster()
