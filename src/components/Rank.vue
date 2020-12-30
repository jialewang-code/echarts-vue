<template>
	<div class="com-container">
		<div class="com-chart" ref="rank_ref"></div>
	</div>
</template>

<script>
import { mapState } from "vuex";

export default {
	name: "Rank",
	data() {
		return {
			chartInstance: null,
			allData: null, //从服务器中获取的所有数据
			startValue: 0, //区域缩放的起点值
			endValue: 9, //区域缩放的终点值
			timeId: null, //定时器标识
		};
	},
	created() {
		//在组件创建完成后，进行回调函数的注册
		this.$socket.registerCallback("rankData", this.getData);
	},
	mounted() {
		this.initChart();
		// this.getData();
		//发送数据给服务器，告诉服务器，我现在需要数据
		this.$socket.send({
			action: "getData",
			socketType: "rankData",
			chartName: "rank",
			value: "",
		});
		window.addEventListener("resize", this.screenAdapter);
		this.screenAdapter();
	},
	destroyed() {
		window.removeEventListener("resize", this.screenAdapter);
		clearInterval(this.timeId);
		//在组件销毁的时候，进行回调函数的取消
		this.$socket.unRegisterCallback("rankData");
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
	methods: {
		initChart() {
			this.chartInstance = this.$echarts.init(this.$refs.rank_ref, this.theme);
			const initOption = {
				title: {
					text: "⎮ 地区销售排行",
					top: 20,
					left: 20,
				},
				grid: {
					top: "40%",
					left: "5%",
					right: "5%",
					bottom: "5%",
					containLabel: true,
				},
				tooltip: {
					show: true,
				},
				xAxis: {
					type: "category",
				},
				yAxis: {
					type: "value",
				},
				series: [
					{
						type: "bar",
					},
				],
			};
			this.chartInstance.setOption(initOption);
			this.chartInstance.on("mouseover", () => {
				clearInterval(this.timeId);
			});
			this.chartInstance.on("mouseout", () => {
				this.startInterval();
			});
		},
		getData(ret) {
			//获取图表数据
			// const { data: ret } = await this.$http.get("rank");
			this.allData = ret;
			//数据从大到小排序
			this.allData.sort((a, b) => {
				return b.value - a.value;
			});
			// console.log(this.allData);
			this.updateChart();
			this.startInterval();
		},
		updateChart() {
			const colorArr = [
				["#0BA82C", "#4FF778"],
				["#2E72BF", "#23E5E5"],
				["#5052EE", "#AB6EE5"],
			];
			//处理获取数据
			//所有省份的数据
			const provinceArr = this.allData.map((item) => {
				return item.name;
			});
			//省份对应的销售数据
			const valueArr = this.allData.map((item) => {
				return item.value;
			});
			const dataOption = {
				xAxis: {
					data: provinceArr,
				},
				dataZoom: {
					show: false,
					startValue: this.startValue,
					endValue: this.endValue,
				},
				series: [
					{
						data: valueArr,
						//柱的颜色渐变
						itemStyle: {
							color: (arg) => {
								let targetColorArr = null;
								// console.log(arg);
								if (arg.data > 300) {
									targetColorArr = colorArr[0];
								} else if (arg.data > 200) {
									targetColorArr = colorArr[1];
								} else {
									targetColorArr = colorArr[2];
								}
								return new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
									{
										offset: 0,
										color: targetColorArr[0],
									},
									{
										offset: 1,
										color: targetColorArr[1],
									},
								]);
							},
						},
					},
				],
			};
			this.chartInstance.setOption(dataOption);
		},
		screenAdapter() {
			const titleFontSize = (this.$refs.rank_ref.offsetWidth / 100) * 3.6;
			const adapterOption = {
				title: {
					textStyle: {
						fontSize: titleFontSize,
					},
				},
				series: [
					{
						barWidth: titleFontSize,
						itemStyle: {
							barBorderRadius: [titleFontSize / 2, titleFontSize / 2, 0, 0],
						},
					},
				],
			};
			this.chartInstance.setOption(adapterOption);
			this.chartInstance.resize();
		},
		startInterval() {
			if (this.timeId) {
				clearInterval(this.timeId);
			}
			this.timeId = setInterval(() => {
				this.startValue++;
				this.endValue++;
				if (this.endValue > this.allData.length - 1) {
					this.startValue = 0;
					this.endValue = 9;
				}
				this.updateChart();
			}, 2000);
		},
	},
};
</script>
<style scoped>
</style>
