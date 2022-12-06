<template>
	<div class="grid">
		<div class="col-12">
			<div class="card">
				<v-network-graph :nodes="nodes" :edges="edges" :configs="configs" >
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
<script>
	import { reactive } from "vue"
	import * as vNG from "v-network-graph"
	import { useContracts } from '../stores/contracts'
	import NFTUri from "../common/NFTURi"
	import axios from 'axios'
	export default {
		props: ['nftUri', 'contractType'],
		components: {  },
		data() {
			return {
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
			this.nodes[startNode] = {name: startNode, size: 48, color: "blue", face: imgUri}
			const filter = {}
			filter[startNode] = 1
			for (let index = outLinksNum - 1; index >= 0; index--) {
				const linkdId = await contract.outLinkOfByIndex(startUri, index)
				const endUri = await contract.endNodeOf(linkdId)
				const endNFTUri = NFTUri.parse(endUri)
				const endContractName = this.contractState.addressName(endNFTUri.contractAddress)
				const endNode = `${endContractName}#${endNFTUri.index}`
				if (!filter[endNode]) {
					filter[endNode] = 1
					const imgUri = await this.getImg(this.projects[endContractName](endNFTUri.index))
					this.nodes[endNode] = {name: endNode, size: 48, color: "blue", face: imgUri}
				}
				const linkNode = `${this.contractType}#${index}`
				if (!filter[linkNode]) {
					filter[linkNode] = 1
					this.nodes[linkNode] = {name: linkNode, size: 16, color: "gray", face:"images/themes/arya-blue.png"}
				}
				// start -> linkNode
				// linkNode -> start
				this.edges[`start->link#${index}`] = {source: startNode, target: linkNode}
				this.edges[`link->end#${index}`] = {source: linkNode, target: endNode}
			}
		},
		computed:{
		},
		methods: {
			async getImg(metadataUri) {
				try {
					const resp = await axios.get(metadataUri)
					return resp.data.image
				} catch (e) {
					console.log(e)
				}
				return "images/v.png"
			}
		}
	}
</script>