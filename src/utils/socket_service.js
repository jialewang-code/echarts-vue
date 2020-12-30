export default class SocketService {
  /**
   * 单例模式
   */
  static instance = null;
  static get Instance() {
    if (!this.instance) {
      this.instance = new SocketService()
    }
    return this.instance;
  }

  //存储回调函数,让数据传送到每一个需要的组件
  callbackMapping = {}

  //判断是否连接成功标识符
  connected = false;

  //发送数据失败的次数累加
  sendRetryCount = 0;

  //重新连接服务器的次数累加
  connectRetryCount = 0;

  //连接服务器的对象
  ws = null
  //定义连接服务端的方法
  connect() {
    if (!window.WebSocket) {
      return console.log('您的浏览器不支持WebSocket');
    }
    this.ws = new WebSocket('ws://localhost:9998')

    //连接服务端成功事件
    this.ws.onopen = () => {
      console.log('连接服务端成功');
      this.connected = true;
      //重置重接连接的次数
      this.connectRetryCount = 0;
    }
    //1.连接服务端失败事件
    //2.连接服务端成功后，服务器关闭后的情况
    this.ws.onclose = () => {
      console.log('连接服务端失败');
      this.connected = false;
      this.connectRetryCount++
      setTimeout(() => {
        this.connect();
      }, this.connectRetryCount * 500);
    }
    //得到服务端发送过来的数据
    this.ws.onmessage = msg => {
      console.log('从服务端接收到了数据');
      //服务端发送过来的数据在 msg 中 data 字段
      // console.log(msg.data);
      const receiveData = JSON.parse(msg.data);
      const socketType = receiveData.socketType;
      //判断回调函数是否存在
      if (this.callbackMapping[socketType]) {
        const action = receiveData.action
        if (action === 'getData') {
          const realData = JSON.parse(receiveData.data)
          this.callbackMapping[socketType].call(this, realData)
        } else if (action === 'fullScreen') {
          this.callbackMapping[socketType].call(this, receiveData)
        } else if (action === 'themeChange') {
          this.callbackMapping[socketType].call(this, receiveData)
        }
      }
    }
  }
  //回调函数的注册
  registerCallback(socketType, callback) {
    this.callbackMapping[socketType] = callback;
  }

  //取消某一个回调函数
  unRegisterCallback(socketType) {
    this.callbackMapping[socketType] = null;
  }

  //发送数据的方法
  send(data) {
    //判断此时此刻有没有连接成功
    if (this.connected) {
      this.sendRetryCount = 0
      this.ws.send(JSON.stringify(data));
    } else {
      this.sendRetryCount++
      setTimeout(() => {
        this.send(data)
      }, this.sendRetryCount * 500);
    }
  }
}