def greet(name="World"):
    """シンプルな挨拶を返す関数"""
    return f"Hello, {name}!"

def calculate_sum(numbers):
    """数値のリストの合計を計算する関数"""
    return sum(numbers)

if __name__ == "__main__":
    # 基本的な挨拶
    print(greet())
    print(greet("Python"))
    
    # リストの合計計算
    numbers = [1, 2, 3, 4, 5]
    total = calculate_sum(numbers)
    print(f"合計: {total}")
