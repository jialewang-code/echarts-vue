<!--商家销量统计的横向柱状图-->
<template>
	<div class="com-container">
		<div class="com-chart" ref="seller_ref"></div>
	</div>
</template>

<script>
import { mapState } from "vuex";

export default {
	name: "Seller",
	data() {
		return {
			chartInstance: null,
			allData: null, //服务器返回的数据
			currentPage: 1, //当前显示的页数
			totalPage: 0, //一共有多少页
			timerId: null, //定时器标识
		};
	},
	computed: {
		// 使用对象展开运算符将 vuex state中 theme 混入 computed 对象中
		...mapState(["theme"]),
	},
	watch: {
		theme() {
			// console.log("主题切换了");
			this.chartInstance.dispose(); //销毁当前的图表
			this.initChart(); //重新以最新的主题名称初始化图表对象
			this.screenAdapter(); //完成屏幕的适配
			this.updateChart(); //更新图表的展示
		},
	},
	created() {
		//在组件创建完成后，进行回调函数的注册
		this.$socket.registerCallback("sellerData", this.getData);
	},
	mounted() {
		this.initChart();
		// this.getData();
		//发送数据给服务器，告诉服务器，我现在需要数据
		this.$socket.send({
			action: "getData",
			socketType: "sellerData",
			chartName: "seller",
			value: "",
		});
		window.addEventListener("resize", this.screenAdapter);
		//在页面加载完成的时候，主动进行屏幕的适配
		this.screenAdapter();
	},
	destroyed() {
		clearInterval(this.timerId);
		//在组件销毁的时候，需要将监听器取消，防止内存泄漏
		window.removeEventListener("resize", this.screenAdapter);
		//在组件销毁的时候，进行回调函数的取消
		this.$socket.unRegisterCallback("sellerData");
	},
	methods: {
		//初始化echarts实例对象
		initChart() {
			this.chartInstance = this.$echarts.init(
				this.$refs.seller_ref,
				this.theme
			);
			const initOption = {
				title: {
					text: "⎮ 商家销售统计",
					left: 20,
					top: 20,
				},
				grid: {
					left: "3%",
					top: "20%",
					right: "6%",
					buttom: "3%",
					containLabel: true, //距离包含坐标轴上文字设置
				},
				tooltip: {
					//显示标签
					trigger: "axis",
					axisPointer: {
						type: "line",
						z: 0,
						lineStyle: {
							color: "#2D3443",
						},
					},
				},
				xAxis: {
					type: "value",
				},
				yAxis: {
					type: "category",
				},
				series: [
					{
						type: "bar",
						//文字显示
						label: {
							show: true,
							position: "right",
							textStyle: {
								color: "white",
							},
						},
						itemStyle: {
							//指明颜色渐变的方向
							//指明不同百分比之下颜色的值
							color: new this.$echarts.graphic.LinearGradient(0, 0, 1, 0, [
								//0状态处的颜色值
								{
									offset: 0,
									color: "#5052EE",
								},
								//100%状态处的颜色值
								{
									offset: 1,
									color: "#AB6EE5",
								},
							]),
						},
					},
				],
			};
			this.chartInstance.setOption(initOption);
			//对图表对象进行鼠标事件的监听
			this.chartInstance.on("mouseover", () => {
				clearInterval(this.timerId);
			});
			this.chartInstance.on("mouseout", () => {
				this.startInterval();
			});
		},
		//获取后台数据
		getData(ret) {
			//http://127.0.0.1:8989/api/seller
			// let { data: ret } = await this.$http.get("seller");
			// console.log(ret);
			this.allData = ret;
			//对数据进行排序
			this.allData.sort((a, b) => {
				return a.value - b.value; //从小到大排序
			});
			//每5个元素显示一页
			this.totalPage = Math.ceil(this.allData.length / 5);
			this.updateChart();
			//启动定时器
			this.startInterval();
		},
		//更新图表
		updateChart() {
			let start = (this.currentPage - 1) * 5;
			let end = this.currentPage * 5;
			const showData = this.allData.slice(start, end);
			const sellerNames = showData.map((item) => {
				return item.name;
			});
			const sellerValues = showData.map((item) => {
				return item.value;
			});
			const dataOption = {
				yAxis: {
					data: sellerNames,
				},
				series: [
					{
						data: sellerValues,
					},
				],
			};
			this.chartInstance.setOption(dataOption);
		},
		startInterval() {
			if (this.timerId) {
				clearInterval(this.timerId);
			}
			this.timerId = setInterval(() => {
				this.currentPage++;
				if (this.currentPage > this.totalPage) {
					this.currentPage = 1;
				}
				this.updateChart();
			}, 3000);
		},
		//浏览器变化时调用 screenAdapter方法，来完成适配
		screenAdapter() {
			const titleFontSize = (this.$refs.seller_ref.offsetWidth / 100) * 3.6;
			//和分辨率大小相关的配置项
			const adapterOption = {
				title: {
					textStyle: {
						fontSize: titleFontSize,
					},
				},

				tooltip: {
					axisPointer: {
						lineStyle: {
							width: titleFontSize,
						},
					},
				},

				series: [
					{
						barWidth: titleFontSize,
						itemStyle: {
							//柱状圆角
							barBorderRadius: [0, titleFontSize / 2, titleFontSize / 2, 0],
						},
					},
				],
			};
			this.chartInstance.setOption(adapterOption);
			//需要手动调用图表对象的resize方法，才会产生效果
			this.chartInstance.resize();
		},
	},
};
</script>
<style scoped>
</style>
