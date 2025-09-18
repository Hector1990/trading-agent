import hashlib
import itertools

try:
    import chromadb
    from chromadb.config import Settings
except Exception:  # pragma: no cover - optional dependency
    chromadb = None
    Settings = None  # type: ignore


class FinancialSituationMemory:
    def __init__(self, name, config, embedding_dim: int = 128):
        self.embedding_dim = embedding_dim
        self._use_chroma = chromadb is not None and Settings is not None
        if self._use_chroma:
            self.chroma_client = chromadb.Client(Settings(allow_reset=True))
            self.situation_collection = self.chroma_client.create_collection(name=name)
        else:
            self._memory_store = []

    def get_embedding(self, text):
        """Generate a deterministic embedding using a hash-based fallback."""

        digest = hashlib.sha256(text.encode("utf-8")).digest()
        byte_cycle = itertools.cycle(digest)
        vector = []
        for _ in range(self.embedding_dim):
            vector.append(next(byte_cycle) / 255.0)
        return vector

    def add_situations(self, situations_and_advice):
        """Add financial situations and their corresponding advice. Parameter is a list of tuples (situation, rec)"""

        situations = []
        advice = []
        ids = []
        embeddings = []

        if not self._use_chroma:
            for situation, recommendation in situations_and_advice:
                self._memory_store.append(
                    {
                        "situation": situation,
                        "recommendation": recommendation,
                        "embedding": self.get_embedding(situation),
                    }
                )
            return

        offset = self.situation_collection.count()

        for i, (situation, recommendation) in enumerate(situations_and_advice):
            situations.append(situation)
            advice.append(recommendation)
            ids.append(str(offset + i))
            embeddings.append(self.get_embedding(situation))

        self.situation_collection.add(
            documents=situations,
            metadatas=[{"recommendation": rec} for rec in advice],
            embeddings=embeddings,
            ids=ids,
        )

    def get_memories(self, current_situation, n_matches=1):
        """Find matching recommendations using the deterministic hash embedding."""
        query_embedding = self.get_embedding(current_situation)

        if not self._use_chroma:
            def cosine_sim(a, b):
                dot = sum(x * y for x, y in zip(a, b))
                norm_a = sum(x * x for x in a) ** 0.5
                norm_b = sum(x * x for x in b) ** 0.5
                return dot / (norm_a * norm_b + 1e-9)

            sorted_items = sorted(
                self._memory_store,
                key=lambda item: cosine_sim(query_embedding, item["embedding"]),
                reverse=True,
            )
            results = []
            for item in sorted_items[:n_matches]:
                results.append(
                    {
                        "matched_situation": item["situation"],
                        "recommendation": item["recommendation"],
                        "similarity_score": cosine_sim(query_embedding, item["embedding"]),
                    }
                )
            return results

        results = self.situation_collection.query(
            query_embeddings=[query_embedding],
            n_results=n_matches,
            include=["metadatas", "documents", "distances"],
        )

        matched_results = []
        for i in range(len(results["documents"][0])):
            matched_results.append(
                {
                    "matched_situation": results["documents"][0][i],
                    "recommendation": results["metadatas"][0][i]["recommendation"],
                    "similarity_score": 1 - results["distances"][0][i],
                }
            )

        return matched_results
