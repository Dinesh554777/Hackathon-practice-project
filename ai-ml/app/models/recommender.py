import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


class ProductRecommender:
    """Hybrid recommendation engine using collaborative and content-based filtering."""

    def __init__(self):
        self.user_product_matrix = None
        self.product_features = None
        self.product_ids = []
        self.user_ids = []
        self.user_index = {}
        self.product_index = {}

    def fit_user_product(self, user_ids, product_ids, ratings):
        """Build the user-product interaction matrix from purchase/review data."""
        unique_users = sorted(set(user_ids))
        unique_products = sorted(set(product_ids))

        self.user_ids = unique_users
        self.product_ids = unique_products
        self.user_index = {uid: i for i, uid in enumerate(unique_users)}
        self.product_index = {pid: i for i, pid in enumerate(unique_products)}

        matrix = np.zeros((len(unique_users), len(unique_products)))
        for u, p, r in zip(user_ids, product_ids, ratings):
            ui = self.user_index.get(u)
            pi = self.product_index.get(p)
            if ui is not None and pi is not None:
                matrix[ui, pi] = r

        self.user_product_matrix = matrix

    def fit_product_features(self, product_ids, feature_matrix):
        """Set product feature vectors for content-based filtering."""
        self.product_ids = product_ids
        self.product_features = np.array(feature_matrix)
        self.product_index = {pid: i for i, pid in enumerate(product_ids)}

    def collaborative_recommendations(self, user_id, top_n=10):
        """Recommend products based on similar users."""
        if self.user_product_matrix is None or user_id not in self.user_index:
            return []

        ui = self.user_index[user_id]
        user_vector = self.user_product_matrix[ui].reshape(1, -1)
        similarities = cosine_similarity(user_vector, self.user_product_matrix)[0]
        similar_users = np.argsort(similarities)[::-1][1:6]

        scores = np.zeros(self.user_product_matrix.shape[1])
        for su in similar_users:
            scores += self.user_product_matrix[su]

        rated = self.user_product_matrix[ui] > 0
        scores[rated] = -1

        top_indices = np.argsort(scores)[::-1][:top_n]
        return [self.product_ids[i] for i in top_indices if scores[i] > 0]

    def content_recommendations(self, product_id, top_n=10):
        """Recommend products similar to a given product."""
        if self.product_features is None or product_id not in self.product_index:
            return []

        pi = self.product_index[product_id]
        vector = self.product_features[pi].reshape(1, -1)
        similarities = cosine_similarity(vector, self.product_features)[0]
        similar = np.argsort(similarities)[::-1][1 : top_n + 1]

        return [self.product_ids[i] for i in similar]

    def hybrid_recommendations(self, user_id, product_id=None, top_n=10):
        """Combine collaborative and content-based recommendations."""
        collab = self.collaborative_recommendations(user_id, top_n // 2)
        if product_id:
            content = self.content_recommendations(product_id, top_n // 2)
        else:
            content = []

        combined = list(dict.fromkeys(collab + content))
        return combined[:top_n]


recommender = ProductRecommender()
