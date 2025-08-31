import os
import sys
from tradingagents.default_config import DEFAULT_CONFIG
from tradingagents.agents.utils.memory import FinancialSituationMemory

def main():
    # Load default config and update with test settings
    config = DEFAULT_CONFIG.copy()
    config.update({
        "backend_url": "https://api.deepseek.com/v1",
        "llm_provider": "deepseek",
        "embedding_model": "deepseek-chat",  # Using chat model for embeddings
        "enable_memory": True
    })

    print("=== Memory System Test ===")
    print(f"Using provider: {config['llm_provider']}")
    print(f"API URL: {config['backend_url']}")
    print(f"Embedding model: {config['embedding_model']}")
    
    try:
        # Initialize memory
        print("\n1. Initializing memory system...")
        memory = FinancialSituationMemory("test_memory", config)
        
        # Test adding a situation
        print("\n2. Adding test situation...")
        test_situations = [
            ("Market shows high volatility with tech stocks dropping",
             "Consider reducing exposure to high-volatility tech stocks and rebalancing portfolio"),
            ("Interest rates are rising rapidly",
             "Consider shifting to value stocks and reducing exposure to growth stocks")
        ]
        memory.add_situations(test_situations)
        
        # Test retrieving memories
        print("\n3. Testing memory retrieval...")
        query = "Tech stocks are unstable"
        print(f"Searching for memories related to: {query}")
        
        memories = memory.get_memories(query, n_matches=2)
        
        if memories:
            print("\n✅ Memory test successful! Found matching memories:")
            for i, mem in enumerate(memories, 1):
                print(f"\nMatch {i}:")
                print(f"Situation: {mem['matched_situation']}")
                print(f"Advice: {mem['recommendation']}")
                print(f"Similarity Score: {mem['similarity_score']:.4f}")
        else:
            print("\n⚠️ No matching memories found, but the API calls were successful.")
            
    except Exception as e:
        print(f"\n❌ Error during memory test:", file=sys.stderr)
        print(f"{str(e)}\n", file=sys.stderr)
        
        # Provide more detailed debugging info
        print("\nDebugging information:")
        print(f"- DEEPSEEK_API_KEY set: {'Yes' if os.environ.get('DEEPSEEK_API_KEY') else 'No'}")
        print(f"- Python version: {sys.version.split()[0]}")
        print(f"- Current directory: {os.getcwd()}")
        
        print("\nPlease verify:")
        print("1. Your DeepSeek API key is set in the DEEPSEEK_API_KEY environment variable")
        print("2. The API key has sufficient permissions and quota")
        print("3. Your network connection is stable")
        print("4. The DeepSeek API is currently operational")
        
        return 1
    
    print("\n✅ Test completed successfully!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
