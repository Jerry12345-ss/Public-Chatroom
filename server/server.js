const express = require('express');
const SocketService = require('ws').Server;

const PORT = '8040';

const server = express().listen(PORT, ()=>{
    console.log(`Server Listen on PORT ${PORT}`);
});

// 建立 WebSocket
const wss = new SocketService({ server });

// 建立連線
wss.on('connection', (ws)=>{
    console.log('[Client connected]');

    // 連線錯誤
    ws.on('error',(err)=>{
        console.log('WebSocket 連線發生錯誤 : ', err);
    });

    // 接收訊息
    ws.on('message', (message)=>{
        try{
            const data = JSON.parse(message.toString());
            console.log('收到訊息:', data);

            // 添加伺服器時間戳
            data.time = new Date();

            // 廣播訊息
            broadCastMessages(data, ws);
        }catch(error){
            console.error('接收訊息時發生錯誤 : ', error);
        }
    });

    // 關閉連線
    ws.on('close', ()=>{
        console.log('Close Connect');
    });
});

// 廣播訊息
const broadCastMessages = (data, ws) =>{
    const message = JSON.stringify(data);

    let clients = wss.clients;

    clients.forEach((client) =>{
        client.send(message);
    });
}

