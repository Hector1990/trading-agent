import os
import json
import hashlib
from typing import List, Dict, Any


class FinancialSituationMemory:
    def __init__(self, name, config):
        """Initialize memory system with simple text-based storage"""
        self.name = name
        self.config = config
        self.memory_file = f"{name}_memory.json"
        self.situations = []
        
        # Load existing memories if file exists
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, 'r') as f:
                    self.situations = json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                self.situations = []

    def _save_to_file(self):
        """Save current situations to file"""
        try:
            with open(self.memory_file, 'w') as f:
                json.dump(self.situations, f, indent=2)
        except Exception as e:
            print(f"Warning: Failed to save memory to file: {e}")

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate simple text similarity using keyword overlap"""
        # Convert to lowercase and split into words
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        # Calculate Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        if union == 0:
            return 0.0
        
        return intersection / union

    def add_situations(self, situations_and_advice):
        """Add financial situations and their corresponding advice. Parameter is a list of tuples (situation, rec)"""
        for situation, recommendation in situations_and_advice:
            memory_entry = {
                "id": hashlib.md5(situation.encode()).hexdigest()[:8],
                "situation": situation,
                "recommendation": recommendation
            }
            
            # Check if this situation already exists
            existing_ids = [mem["id"] for mem in self.situations]
            if memory_entry["id"] not in existing_ids:
                self.situations.append(memory_entry)
        
        self._save_to_file()

    def get_memories(self, current_situation, n_matches=1):
        """Find matching recommendations using text similarity"""
        if not self.situations:
            return []
        
        # Calculate similarity scores for all stored situations
        scored_memories = []
        for memory in self.situations:
            similarity = self._calculate_similarity(current_situation, memory["situation"])
            scored_memories.append({
                "matched_situation": memory["situation"],
                "recommendation": memory["recommendation"],
                "similarity_score": similarity
            })
        
        # Sort by similarity score and return top n_matches
        scored_memories.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_memories[:n_matches]


if __name__ == "__main__":
    # Example usage
    config = {"llm_provider": "test"}
    matcher = FinancialSituationMemory("test", config)

    # Example data
    example_data = [
        (
            "High inflation rate with rising interest rates and declining consumer spending",
            "Consider defensive sectors like consumer staples and utilities. Review fixed-income portfolio duration.",
        ),
        (
            "Tech sector showing high volatility with increasing institutional selling pressure",
            "Reduce exposure to high-growth tech stocks. Look for value opportunities in established tech companies with strong cash flows.",
        ),
        (
            "Strong dollar affecting emerging markets with increasing forex volatility",
            "Hedge currency exposure in international positions. Consider reducing allocation to emerging market debt.",
        ),
        (
            "Market showing signs of sector rotation with rising yields",
            "Rebalance portfolio to maintain target allocations. Consider increasing exposure to sectors benefiting from higher rates.",
        ),
    ]

    # Add example data
    matcher.add_situations(example_data)

    # Test retrieval
    test_query = "High inflation and rising rates affecting market sentiment"
    matches = matcher.get_memories(test_query, n_matches=2)
