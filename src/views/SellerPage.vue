<!--
针对 /sellerpage 这条路径显示出来的组件
在这个组件中，通过子组件注册的方式，要显示出Seller.vue这个组件
-->
<template>
  <div class="com-page">
    <seller></seller>
  </div>
</template>

<script>
import Seller from "@/components/Seller";

export default {
  name: "",
  components: {
    Seller,
  },
};
</script>
<style scoped>
</style>
