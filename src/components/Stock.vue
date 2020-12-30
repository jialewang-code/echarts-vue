<template>
	<div class="com-container">
		<div class="com-chart" ref="stock_ref"></div>
	</div>
</template>

<script>
import { mapState } from "vuex";

export default {
	name: "Stock",
	data() {
		return {
			chartInstance: null,
			allData: null, //从服务器中获取的所有数据
			currentIndex: 0, //当前数据展示页数
			timeId: null, //定时器标识
		};
	},
	created() {
		this.$socket.registerCallback("stockData", this.getData);
	},
	mounted() {
		this.initChart();
		// this.getData();
		this.$socket.send({
			action: "getData",
			socketType: "stockData",
			chartName: "stock",
			value: "",
		});
		window.addEventListener("resize", this.screenAdapter);
		this.screenAdapter();
	},
	destroyed() {
		window.removeEventListener("resize", this.screenAdapter);
		clearInterval(this.timeId);
		this.$$socket.unRegisterCallback("stockData");
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
			this.chartInstance = this.$echarts.init(this.$refs.stock_ref, this.theme);
			const initOption = {
				title: {
					text: "⎮ 库存和销量分析",
					top: 20,
					left: 20,
				},
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
			// const { data: ret } = await this.$http.get("stock");
			this.allData = ret;
			// console.log(this.allData);
			this.updateChart();
			this.startInterval();
		},
		updateChart() {
			const centerArr = [
				["18%", "40%"],
				["50%", "40%"],
				["82%", "40%"],
				["34%", "75%"],
				["66%", "75%"],
			];
			const colorArr = [
				["#4FF778", "#0BA82C"],
				["#E5DD45", "#E8B11C"],
				["#E8821C", "#E55445"],
				["#5052EE", "#AB6EE5"],
				["#23E5E5", "#2E72BF"],
			];
			//处理获取数据
			const start = this.currentIndex * 5;
			const end = (this.currentIndex + 1) * 5;
			const showData = this.allData.slice(start, end); //5个一起展示
			const seriesArr = showData.map((item, index) => {
				return {
					type: "pie",
					center: centerArr[index],
					hoverAnimation: false, //关闭鼠标移入到饼图时的动画效果
					labelLine: {
						show: false, //隐藏指示线
					},
					label: {
						position: "center", //文字中心显示
						color: colorArr[index][0],
					},
					data: [
						{
							name: item.name + "\n\n" + item.sales,
							value: item.sales,
							itemStyle: {
								color: new this.$echarts.graphic.LinearGradient(0, 1, 0, 0, [
									{
										offset: 0,
										color: colorArr[index][0],
									},
									{
										offset: 1,
										color: colorArr[index][1],
									},
								]),
							},
						},
						{
							value: item.stock,
							itemStyle: {
								color: "#333843",
							},
						},
					],
				};
			});
			const dataOption = {
				series: seriesArr,
			};
			this.chartInstance.setOption(dataOption);
		},
		screenAdapter() {
			const titleFontSize = (this.$refs.stock_ref.offsetWidth / 100) * 3.6;
			const innerRadius = titleFontSize * 2.8; //内圆半径
			const outterRadius = innerRadius * 1.125; //外圆半径
			const adapterOption = {
				title: {
					textStyle: {
						fontSize: titleFontSize,
					},
				},
				series: [
					{
						type: "pie",
						radius: [outterRadius, innerRadius],
						label: {
							fontSize: titleFontSize / 2,
						},
					},
					{
						type: "pie",
						radius: [outterRadius, innerRadius],
						label: {
							fontSize: titleFontSize / 2,
						},
					},
					{
						type: "pie",
						radius: [outterRadius, innerRadius],
						label: {
							fontSize: titleFontSize / 2,
						},
					},
					{
						type: "pie",
						radius: [outterRadius, innerRadius],
						label: {
							fontSize: titleFontSize / 2,
						},
					},
					{
						type: "pie",
						radius: [outterRadius, innerRadius],
						label: {
							fontSize: titleFontSize / 2,
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
				this.currentIndex++;
				if (this.currentIndex > 1) {
					this.currentIndex = 0;
				}
				this.updateChart(); //更改完 currentIndex 后，需要更新界面
			}, 5000);
		},
	},
};
</script>
<style scoped>
</style>
