// シンプルなHTTPサーバーの例
const http = require('http');

const PORT = 3000;

// サーバーの作成
const server = http.createServer((req, res) => {
    // レスポンスヘッダーの設定
    res.writeHead(200, {'Content-Type': 'text/plain'});
    
    // 現在時刻を含むメッセージを送信
    const message = `Hello Node.js! Current time: ${new Date().toLocaleString()}`;
    res.end(message);
});

// サーバーの起動
server.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

// 基本的な非同期処理の例
setTimeout(() => {
    console.log('3秒経過しました');
}, 3000);

// 配列操作の例
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(num => num * 2);
console.log('倍にした数:', doubled);
