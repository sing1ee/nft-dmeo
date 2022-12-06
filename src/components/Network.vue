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
	import { useContracts } from '../stores/contracts'
	import NFTUri from "../common/NFTURi"
	import axios from 'axios'
	import dagre from "dagre/dist/dagre.min.js"

	export default {
		props: ['nftUri', 'contractType'],
		components: {  },
		data() {
			return {
				nodeSize: 32,
				projects: null,
				nodes: {
				},
				edges: {
				},
				layouts: reactive({
					nodes: {},
				}),
				configs: {

				},
				contractState: useContracts()

			}
		},
		async created() {
			this.projects = this.contractState.projects

			const initialConfigs = vNG.defineConfigs({
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
				},
			})
			this.configs = reactive(initialConfigs)

			const contractWrapper = this.contractState.getContractByName(this.contractType)
			const contract = contractWrapper.signer
			const startUri = this.nftUri.toString()
			const outLinksNum = await contract.outLinksNumOf(startUri)
			const startContractName = this.contractState.addressName(this.nftUri.contractAddress)
			const startNode = `${startContractName}#${this.nftUri.index}`
			const imgUri = await this.getImg(this.projects[startContractName](this.nftUri.index))
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
				// linkNode -> start
				this.edges[`start->link#${index}`] = {source: startNode, target: linkNode}
				if (!filter[linkNode]) {
					filter[linkNode] = 1
					this.nodes[linkNode] = {name: linkNode, size: this.nodeSize / 2, color: "gray", face:"images/themes/arya-blue.png"}
				}
				this.edges[`link->end#${index}`] = {source: linkNode, target: endNode}
				if (!filter[endNode]) {
					filter[endNode] = 1
					const imgUri = await this.getImg(this.projects[endContractName](endNFTUri.index))
					this.nodes[endNode] = {name: endNode, size: this.nodeSize, color: "blue", face: imgUri}
				}
			}
			this.layout("LR")
		},
		computed:{
		},
		methods: {
			async getImg(metadataUri) {
				try {
					const resp = await axios.get(metadataUri, {timeout: 1000 * 10})
					return resp.data.image
				} catch (e) {
					console.log(e)
				}
				return "images/v.png"
			},
			layout(direction) {
				// "TB" | "LR"
				if (Object.keys(this.nodes).length <= 1 || Object.keys(this.edges).length == 0) {
					return
				}

				// convert graph
				// ref: https://github.com/dagrejs/dagre/wiki
				const g = new dagre.graphlib.Graph()
				// Set an object for the graph label
				g.setGraph({
					rankdir: direction,
					nodesep: this.nodeSize * 2,
					edgesep: this.nodeSize,
					ranksep: this.nodeSize * 2,
				})
				// Default to assigning a new object as a label for each new edge.
				g.setDefaultEdgeLabel(() => ({}))

				// Add nodes to the graph. The first argument is the node id. The second is
				// metadata about the node. In this case we're going to add labels to each of
				// our nodes.
				Object.entries(this.nodes).forEach(([nodeId, node]) => {
					g.setNode(nodeId, { label: node.name, width: this.nodeSize, height: this.nodeSize })
				})

				// Add edges to the graph.
				Object.values(this.edges).forEach(edge => {
					g.setEdge(edge.source, edge.target)
				})

				dagre.layout(g)

				const box  = {
					top: this.nodeSize*100,
					bottom: 0,
					left: this.nodeSize*100,
					right: 0,
				}
				g.nodes().forEach((nodeId) => {
					// update node position
					const x = g.node(nodeId).x
					const y = g.node(nodeId).y
					this.layouts.nodes[nodeId] = { x, y }

					// calculate bounding box size
					box.top = Math.min(box.top, y)
					box.bottom = Math.max(box.bottom, y)
					box.left = Math.min(box.left, x)
					box.right = Math.max(box.right, x)
				})

				const graphMargin = this.nodeSize
				const viewBox = {
					top: box.top - graphMargin,
					bottom: box.bottom + graphMargin,
					left: box.left - graphMargin,
					right: box.right + graphMargin,
				}
				this.$refs.graph.setViewBox(viewBox)
			},

			updateLayout(direction) {
				// "TB" | "LR"
				// Animates the movement of an element.
				this.$refs.graph.transitionWhile(() => {
					this.layout(direction)
				})
			}
		}
	}
</script>