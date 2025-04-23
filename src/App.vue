<template>
  <div class="container mx-auto px-4 my-4">
    <div class="flex flex-col justify-center items-center gap-2">
      <h1 class="text-3xl !font-medium py-4 text-gray-700">簡易聊天室</h1>

      <div class="chat-container h-[800px] w-full min-w-[330px] max-w-[500px] rounded border border-gray-300">
        <div class="flex flex-col justify-between h-full">
          <div class="messages-container flex-1 p-4 overflow-y-auto" ref="messageContainer" @scroll="handleScroll">
            <div class="flex flex-col gap-4">
              <!-- 這裏針對 css 還要處理 -->
              <div v-for="message in messages" :key="message.time" :id="message.time">
                <div class="flex flex-col" :class="{'max-w-[70%]' : message.type !== 'system', 'ml-auto items-end' : message.type === 'myself', 'mr-auto items-start' : message.type === 'other' }">
                  <div class="p-4 rounded inline-block h-auto w-full message-content" 
                    :class="[messageBgColor(message), { '!w-fit' : message.type !== 'system' }]"
                    >
                    <div class="flex items-center gap-2 flex-wrap">
                      <div class="text-gray-600">{{ message.sender }} : </div>
                      <div class="overflow-hidden break-words text-gray-600">{{ message.content }}</div>
                    </div>
                  </div>
                  <div class="text-sm text-gray-400 mt-2">{{ message.time }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="input-container h-20 p-4 border-[#adb163] bg-[#cbce99] ">
            <div class="flex gap-4 h-full">
              <!-- 這裡要用 keypress, 不能用 keydown(差異在於中文輸入有無問題) -->
              <input v-model.trim="clientMessage" @keypress.enter="sendMessage" type="text" :placeholder="!isConnected ? '連線發生錯誤 ,暫時無法輸入' : '輸入訊息...'" class="h-full border border-[#adb163] rounded bg-[#eff1c9] flex-1 outline-none px-4">
              <button @click="sendMessage" :disabled="!isConnected" :class="[!isConnected ? 'cursor-not-allowed' : 'cursor-pointer', { disabled : !isConnected }]" class="message-btn px-4 py-2 text-white bg-[#949755] rounded transition-colors hover:bg-[#6a6c3d]">發送</button>
            </div>
          </div>
        </div>
      </div>

      <div class="status-container">
        <div class="flex gap-2 items-center py-2" :class="['status', { connect : isConnected }]">
          <div>連線狀態 :</div>
          <div :style="{ color : connectStatus.color }">{{ connectStatus.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, reactive, useTemplateRef, nextTick } from 'vue';
import { messageBg } from './data/message';

const socket = ref(null);
const clientMessage = ref('');
const username = ref(`用戶 ${Math.floor(Math.random() * 1000)}`);
const isConnected = ref(false);
const messages = ref([]);
const connectStatus = reactive({
  text : '',
  color : null
});
const isAtBottom = ref(false);
const messageContainer = useTemplateRef('messageContainer');

onMounted(()=>{
  connectWebSocket(); 
});

onUnmounted(()=>{
  // 關閉連線
  if(socket.value){
    socket.value.close();
  }
});

const messageBgColor = ((message)=>{
  return messageBg.find(item => message.type === item.type).bgColor;
});

// 建立與 WebSocket 連線
const connectWebSocket = () =>{
  socket.value = new WebSocket('ws://localhost:8030');

  socket.value.onopen = () =>{
    console.log('open websocket connection');

    setConnectConfig(true, '已連接', '#7BA23F');

    const message = {
      sender : '系統',
      content : `${username.value} 已加入聊天室!`,
      time : new Date().toLocaleTimeString(),
      type : 'system' 
    };
    socket.value.send(JSON.stringify(message));
  };

  // 接收訊息
  socket.value.onmessage = async(event) =>{
    const message = JSON.parse(event.data);

    if(message.sender !== '系統') message.type =  message.sender === username.value ? 'myself' : 'other'

    messages.value.push({
      ...message,
      time : new Date().toLocaleTimeString(),
      type : message.type
    });

    await nextTick();
    console.log(messageContainer.value.scrollTop, messageContainer.value.scrollHeight, messageContainer.value.clientHeight)
    
    if(messageContainer.value.scrollTop + messageContainer.value.clientHeight <= messageContainer.value.scrollHeight){
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }else{
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  }

  // 關閉連線
  socket.value.onclose = () =>{
    setConnectConfig(false, '連線已關閉, 請重新嘗試...', 'red');
  }

  // 連線錯誤
  socket.value.onerror = (error) =>{
    console.error(error);
    setConnectConfig(false, '連線失敗, 請重新嘗試...', 'red');
  }
}

// 寄送訊息
const sendMessage = () =>{
  const message= {
    sender : username.value,
    content : clientMessage.value,
    time : new Date(), // 寄送訊息的時間
  };

  socket.value.send(JSON.stringify(message));
  clientMessage.value = '';
}

const setConnectConfig = (status, text, color) =>{
  isConnected.value = status;
  connectStatus.text = text;
  connectStatus.color = color;
}

// 滾動至底部
const scrollToBottom = () =>{
  // 
}

const handleScroll = (event) =>{
  const { scrollTop, scrollHeight } = event.target;
  console.log(scrollTop, scrollHeight)
}
</script>

<style lang="scss" scoped>
.chat-container{
  background-image: url('../src/assets/img/chatroom-bg.jpg');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  
  .message-content{
    min-height: fit-content;
    box-shadow: 0 0 15px 3px rgba(0, 0, 0, .2);
  }

  .message-btn{
    &.disabled{
      background-color: rgb(146, 145, 145);
    } 
  }
}
</style>

<!-- 
  1. 如果畫面在最下面, 要自動移動
  2. 如果不是最下面 : 要做那種像 Line 那種? 只是不做那種有幾則未讀那樣, 頂多給個箭頭到最下面這樣
  3. 針對於訊息的部分, CSS 要額外處理... (最麻煩)
-->