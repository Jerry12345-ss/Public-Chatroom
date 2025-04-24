<template>
    <div>
        {{ currentTime.toLocaleString() }}
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const currentTime = ref(new Date());
let timer = null;

onMounted(()=>{
    timer = setInterval(updateTimee, 1000); 
});

onUnmounted(()=>{
    if(timer){
        clearInterval(timer);
    } 
});

// 更新當前時間
const updateTimee = () =>{
    currentTime.value = new Date(); 
}
</script>

<style lang="scss" scoped>

</style>