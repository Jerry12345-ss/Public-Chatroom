<template>
  <div class="container mx-auto max-w-[950px] min-h-screen px-4 py-8">
    <div class="containers w-full flex items-center justify-center rounded">
      <div class="flex flex-col md:flex-row justify-around items-center gap-4 w-full p-4 py-6">
        <!-- 資訊欄 -->
        <div class="chatroom-info flex flex-col gap-2 items-center md:items-start md:w-[270px]">
          <h1 class="text-3xl !font-medium py-4 text-gray-700 pt-8">簡易公開聊天室</h1>

          <div class="flex flex-col gap-2 flex-wrap items-center md:items-start">
            <div class="flex gap-1">
              <div>用戶名稱 :</div>
              <div>{{ username }}</div>
            </div>
            <div class="flex flex-wrap gap-1">
              <div>當前時間 :</div>
              <DynamicDateTime/>
            </div>
  
            <!-- 連線狀態 -->
            <div class="status-container">
              <div class="flex gap-1 flex-wrap" :class="['status', { connect : isConnected }]">
                <div>連線狀態 :</div>
                <div :style="{ color : connectStatus.color }" class="font-medium">{{ connectStatus.text }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 聊天室 -->
        <div class="chat-container h-[850px] w-full min-w-[280px] max-w-[500px] rounded border border-gray-300">
          <div class="flex flex-col justify-between h-full relative">
            <div class="messages-container flex-1 overflow-y-auto" ref="messageContainer" @scroll="handleScroll">
              <div class="p-4">
                <div class="flex flex-col gap-4">
                  <div v-for="message in messages" :key="message.time" :id="message.time">
                    <div class="flex flex-col" :class="{'max-w-[70%]' : message.type !== 'system', 'ml-auto items-end' : message.type === 'myself', 'mr-auto items-start' : message.type === 'other' }">
                      <div class="p-4 rounded inline-block h-auto w-full message-content" 
                        :class="[messageBgColor(message), { '!w-fit' : message.type !== 'system' } ]"
                        >
                        <div class="flex flex-col">
                          <div>
                            <span class="text-gray-600">{{ message.sender }} : </span>
                            <template v-if="!message.isURL">
                              <span class="text-gray-600" style="word-wrap: break-word; word-break: break-all; white-space: pre-wrap;" >{{ message.content }}</span>
                            </template>
                            <template v-else>
                              <a :href="message.content" target="_blank" class="text-blue-500 underline" style="word-wrap: break-word; word-break: break-all; white-space: pre-wrap;">{{ message.content }}</a>
                            </template>
                          </div>
                          
                          <div class="text-xs text-gray-400 mt-2">{{ message.time }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="input-container p-4 border-[#adb163] bg-[#cbce99] relative">
              <!-- 向下箭頭 -->
              <template v-if="!isAtBottom && !showUnRead">
                <div class="absolute top-[-3.5rem] right-8 z-[100000]">
                  <button @click="scrollToBottom" style="box-shadow: 0 0 15px 3px rgba(0, 0, 0, .2);" class="cursor-pointer w-[40px] h-[40px] bg-[#adb163] rounded flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" style="fill: white;transform: ;msFilter:;"><path d="m18.707 12.707-1.414-1.414L13 15.586V6h-2v9.586l-4.293-4.293-1.414 1.414L12 19.414z"></path></svg>
                  </button>
                </div>
              </template>

              <!-- 未讀訊息 -->
              <template v-if="showUnRead && unReadData?.type !== 'system'">
                <div class="h-14 p-4 unread-container absolute left-0 top-[-56px] w-full z-[100000] cursor-pointer" @click="scrollToBottom">
                  <div class="text-gray-600 truncate">{{ unReadData.sender }} : {{ unReadData.content }}</div>
                </div>
              </template>

              <div class="flex gap-4 h-full">
                <input v-model.trim="clientMessage" @keypress.enter="sendMessage" :disabled="!isConnected" :class="{ 'cursor-not-allowed' : !isConnected }" type="text" :placeholder="!isConnected ? '連線發生錯誤 ,暫時無法輸入' : '輸入訊息...'" class="h-full border border-[#adb163] rounded bg-[#eff1c9] flex-1 outline-none px-4">

                <!-- 這裡要用 keypress, 不能用 keydown(差異在於中文輸入有無問題) -->
                <!-- <textarea 
                  v-model.trim="clientMessage"
                  @keypress.enter="sendMessage"
                  :disabled="!isConnected"
                  :class="{ 'cursor-not-allowed' : !isConnected }"
                  :placeholder="!isConnected ? '連線發生錯誤 ,暫時無法輸入' : '輸入訊息...'"
                  class="min-h-[40px] max-h-[150px] border border-[#adb163] rounded bg-[#efffc9] flex-1 outline-none px-4 py-2"
                  rows="1"
                  style="resize: none;"
                  @input="autoResize"
                ></textarea> -->
                <div class="flex flex-col justify-end">
                  <button @click="sendMessage" :disabled="!isConnected" :class="[!isConnected ? 'cursor-not-allowed' : 'cursor-pointer', { disabled : !isConnected }]" class="hidden sm:block message-btn px-4 py-2 text-white bg-[#949755] rounded transition-colors hover:bg-[#6a6c3d]">發送</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, reactive, useTemplateRef, nextTick } from 'vue';
import { messageBg } from './data/message';
import DynamicDateTime from './component/DynamicDateTime.vue';

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
const showUnRead = ref(false);
const unReadData = ref({});

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

    scrollToBottom();
  };

  // 接收訊息
  socket.value.onmessage = async(event) =>{
    const message = JSON.parse(event.data);

    if(message.sender !== '系統') message.type = message.sender === username.value ? 'myself' : 'other';
    checkIsURL(message);

    messages.value.push({
      ...message,
      time : new Date().toLocaleTimeString(),
      type : message.type
    });

    await nextTick();
    // console.log(messageContainer.value.scrollTop, messageContainer.value.scrollHeight, messageContainer.value.clientHeight)
    
    // if(messageContainer.value.scrollTop + messageContainer.value.clientHeight <= messageContainer.value.scrollHeight){
    //   messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    // }else{
    //   messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    // }
    if(message.type === 'system'){
      showUnRead.value = false;
    }else{
      if (isAtBottom.value) {
        showUnRead.value = false;
        scrollToBottom(); // 如果滾動條在底部，自動滾動到底部
      }else{
        showUnRead.value = true;
        unReadData.value = message;
      } 
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
  if(clientMessage.value.trim() === null || clientMessage.value.trim() === '') return;

  const message= {
    sender : username.value,
    content : clientMessage.value,
    time : new Date(), // 寄送訊息的時間
  };

  socket.value.send(JSON.stringify(message));
  clientMessage.value = null;
  scrollToBottom();
}

const setConnectConfig = (status, text, color) =>{
  isConnected.value = status;
  connectStatus.text = text;
  connectStatus.color = color;
}

// 滾動至底部
const scrollToBottom = () =>{
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    isAtBottom.value = true; // 更新狀態為在底部
  }
}

const handleScroll = (event) =>{
  if (messageContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = messageContainer.value;
    isAtBottom.value = scrollTop + clientHeight >= scrollHeight - 10; // 判斷是否接近底部
    if (isAtBottom.value) {
      showUnRead.value = false; // 如果在底部，隱藏未讀提示
    } 
  }
}

// 判斷是否為超連結, 是則轉為超連結格式
const checkIsURL = (message) =>{
  const urlRegex = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;

  if(urlRegex.test(message.content)){
    message.isURL = true;
  }else{
    message.isURL = false;
  }
}

// const autoResize = (event) =>{
//   // if(event.data === null || event.data === '') return;

//   const textarea = event.target;
//   // // 重置高度以準確計算
//   // textarea.style.height = 'auto';
//   // 設置高度以適應內容，但不超過最大高度
//   textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
// }

// const handleKeyDown = (event) => {
//   if (event.key === 'Enter') {
//     if (event.shiftKey) {
//       // Shift + Enter：換行
//       event.preventDefault(); // 阻止預設的換行行為
//       const textarea = event.target;
//       const cursorPosition = textarea.selectionStart;
//       clientMessage.value =
//         clientMessage.value.slice(0, cursorPosition) +
//         '\n' +
//         clientMessage.value.slice(cursorPosition);
//       nextTick(() => {
//         textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1;
//       });
//     } else {
//       // Enter：發送訊息
//       event.preventDefault(); // 阻止預設的換行行為
//       sendMessage();
//     }
//   }
// };
</script>

<style lang="scss" scoped>
// @mixin
@mixin boxShadow($x, $y, $blur, $spread, $color){
  box-shadow: $x $y $blur $spread $color;
}
@mixin backGround($color){
  background-color: $color;
}

.containers{
  @include backGround(rgba(234, 233, 233, 0.6));
  @include boxShadow(0, 0, 50px, 10px, rgba(143, 142, 142, 0.2));
}

.chat-container{
  background : {
    image : url('../src/assets/img/chatroom-bg.jpg');
    position : center;
    size : cover;
    repeat : no-repeat;
  }
  
  .message-content{
    min-height: fit-content;
    @include boxShadow(0, 0, 15px, 3px, rgba(0, 0, 0, .2));
  }

  .message-btn{
    &.disabled{
      @include backGround(rgb(146, 145, 145));
    } 
  }

  .unread-container{
    @include backGround(rgba(245, 233, 207, .8));
  }
}
</style>

<!-- 
  1. 針對於滾輪那裡的程式碼要稍微研究一下

  ** 如果要用 textarea 會有以下 3 個問題, 但如果用 input 就不會有這些問題
  2. 輸入欄位換成 textarea, shift + enter 換行, enter 發送訊息(要研究, 而且要自動將滾輪移動至最下面) => 這個有點麻煩, 可以先不搞這個
  3. 輸入欄位有 max-height, 超過就要出現滾動條, 然後抱著他們(textarea + button)的 container 也要自同調整高度
  4. continaer 調整高度時, 上面的內容要自通調整高度還位置...

  ** 如果還要新增其他功能, 比如說與 Firebase 串接, 製作自創建使用者、聊天訊息儲存(依照日期時間儲存)之類的, 更甚至傳送圖片之類的, 這些都可以再進行擴充 
-->