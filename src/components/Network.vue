<template>
	<div class="grid">
		<div class="col-12">
			<div class="card">
				<v-network-graph ref="graph" class="graph" :nodes="nodes" :edges="edges" :configs="configs" >
					<defs>
					<!--
						Define the path for clipping the face image.
						To change the size of the applied node as it changes,
						add the `clipPathUnits="objectBoundingBox"` attribute
						and specify the relative size (0.0~1.0).
					-->
					<clipPath id="faceCircle" clipPathUnits="objectBoundingBox">
						<circle cx="0.5" cy="0.5" r="0.5" />
					</clipPath>
					</defs>

					<!-- Replace the node component -->
					<template #override-node="{ nodeId, scale, config, ...slotProps }">
					<!-- circle for filling background -->
					<circle
						class="face-circle"
						:r="config.radius * scale"
						fill="#ffffff"
						v-bind="slotProps"
					/>
					<!--
						The base position of the <image /> is top left. The node's
						center should be (0,0), so slide it by specifying x and y.
					-->
					<image
						class="face-picture"
						:x="-config.radius * scale"
						:y="-config.radius * scale"
						:width="config.radius * scale * 2"
						:height="config.radius * scale * 2"
						:xlink:href="`${nodes[nodeId].face}`"
						clip-path="url(#faceCircle)"
					/>
					<!-- circle for drawing stroke -->
					<circle
						class="face-circle"
						:r="config.radius * scale"
						fill="none"
						stroke="#808080"
						:stroke-width="1 * scale"
						v-bind="slotProps"
					/>
					</template>
				</v-network-graph>
			</div>
		</div>
	</div>
</template>
<style>
.graph {
	width: 800px;
	height: 600px;
}
</style>
<script>
	import { reactive } from "vue"
	import * as vNG from "v-network-graph"
	import {
		ForceLayout
	} from "v-network-graph/lib/force-layout"
	import { useContracts } from '../stores/contracts'
	import NFTUri from "../common/NFTURi"

	export default {
		props: ['nftUri', 'contractType'],
		components: {  },
		data() {
			return {
				nodeSize: 40,
				projects: null,
				nodes: {
				},
				edges: {
				},
				configs: {

				},
				contractState: useContracts()

			}
		},
		async created() {
			this.projects = this.contractState.projects

			const initialConfigs = vNG.defineConfigs({
				view: {
					layoutHandler: new ForceLayout({
						positionFixedByDrag: false,
						positionFixedByClickWithAltKey: true,
						// * The following are the default parameters for the simulation.
						// * You can customize it by uncommenting below.
						createSimulation: (d3, nodes, edges) => {
							const forceLink = d3.forceLink(edges).id(d => d.id)
							return d3.forceSimulation(nodes).force("edge", forceLink.distance(200)).force("charge", d3.forceManyBody())
								.force("collide", d3.forceCollide(100).strength(0.2))
								.force("center", d3.forceCenter().strength(0.05))
								.alphaMin(0.001)
						}
					}),
				},
				node: {
					normal: {
						type: "circle",
						radius: node => node.size, // Use the value of each node object
						color: node => node.color,
					},
				},
				edge: {
					selectable: true,
					normal: {
						width: 3,
						color: "#4466cc",
						dasharray: "0",
						linecap: "butt",
						animate: false,
						animationSpeed: 50,
					},
					hover: {
						width: 4,
						color: "#3355bb",
						dasharray: "0",
						linecap: "butt",
						animate: false,
						animationSpeed: 50,
					},
					selected: {
						width: 3,
						color: "#dd8800",
						dasharray: "6",
						linecap: "round",
						animate: false,
						animationSpeed: 50,
					},
					gap: 5,
					type: "straight",
					margin: 2,
					marker: {
						source: {
							type: "none",
							width: 4,
							height: 4,
							margin: -1,
							units: "strokeWidth",
							color: null,
						},
						target: {
							type: "arrow",
							width: 4,
							height: 4,
							margin: -1,
							units: "strokeWidth",
							color: null,
						},
					},
				}
			})
			this.configs = reactive(initialConfigs)

			const contractWrapper = this.contractState.getContractByName(this.contractType)
			const contract = contractWrapper.signer
			const startUri = this.nftUri.toString()
			const outLinksNum = await contract.outLinksNumOf(startUri)
			const startContractName = this.contractState.addressName(this.nftUri.contractAddress)
			const startNode = `StartNode:${startContractName}#${this.nftUri.index}`
			const imgUri = await this.getImg(startContractName, this.nftUri.index)
			this.nodes[startNode] = {name: startNode, size: this.nodeSize, color: "blue", face: imgUri}
			const filter = {}
			filter[startNode] = 1
			for (let index = outLinksNum - 1; index >= 0; index--) {
				const linkdId = await contract.outLinkOfByIndex(startUri, index)
				const endUri = await contract.endNodeOf(linkdId)
				const endNFTUri = NFTUri.parse(endUri)
				const endContractName = this.contractState.addressName(endNFTUri.contractAddress)
				const endNode = `${endContractName}#${endNFTUri.index}`
				const linkNode = `${this.contractType}#${index}`
				
				
				// start -> linkNode
				// linkNode -> end
				this.edges[`start->link#${index}`] = {source: startNode, target: linkNode}
				if (!filter[linkNode]) {
					filter[linkNode] = 1
					this.nodes[linkNode] = {name: linkNode, size: this.nodeSize/2, color: "gray", face:"images/themes/arya-blue.png"}
				}
				this.edges[`link->end#${index}`] = {source: linkNode, target: endNode}
				if (!filter[endNode]) {
					filter[endNode] = 1
					const imgUri = await this.getImg(endContractName, endNFTUri.index)
					this.nodes[endNode] = {name: endNode, size: this.nodeSize, color: "blue", face: imgUri}
				}
			}
		},
		computed:{
		},
		methods: {
			async getImg(key, index) {
				try {
					return `images/nft/${key}/${index}.png`
				} catch (e) {
					console.log(e)
				}
				return "images/v.png"
			},
		}
	}
</script>