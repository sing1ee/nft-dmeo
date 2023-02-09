<template>
	<div class="grid">
		<div class="col-12">
			<div class="card">
				<h5>Value Link Scan</h5>
                <Toast />
				<ProgressBar v-if="loading" mode="indeterminate"/>
				<Dialog header="Show Value Link" v-model:visible="imageDialog" :breakpoints="{'960px': '75vw'}" :style="{width: '80vw'}" :contentStyle="{minHeight: '450px'}" :modal="true">
					<img id="bigimg" :src="imageData" width="600px" class="my-4 md:my-0 w-9 md:w-10rem shadow-2 mr-5" />
					<template #footer>
						<Button label="Close" @click="()=>{imageDialog=false}" icon="pi pi-check" class="p-button-outlined"/>
					</template>
				</Dialog>
				<Dialog header="LinkTo new NFT" v-model:visible="linkDialog" :breakpoints="{'960px': '75vw'}" :style="{width: '80vw'}" :modal="true">
					<p class="line-height-3 m-0">
						Please enter the URI of the end NFT specified by Value Link, and we will provide a convenient selection tool in the future.
					</p>
					<br />
					<span class="p-float-label">
						<InputText id="endNFTUri" type="text" v-model="endNFTUri" :style="{width: '70vw'}"/>
						<label for="endNFTUri">End NFT Uri</label>
					</span>
					<br />
					<template #footer>
						<Button label="Mint" @click="link()" icon="pi pi-check" class="p-button-outlined"/>
					</template>
				</Dialog>
				<DataView :value="dataviewValue" :layout="layout" :paginator="true" :rows="9">
					<template #header>
						<div class="grid grid-nogutter">
							<div class="col-6 text-left">
								<Dropdown v-model="valueLinkType" :options="valueLinkOptions" optionValue="value" optionLabel="label" placeholder="Choose Value Link" @change="onVLChange($event)"/>
							</div>
							<div class="col-6 text-right">
								<DataViewLayoutOptions v-model="layout" />
							</div>
						</div>
					</template>
					<template #list="slotProps">
						<div class="col-12">
							<div class="flex flex-column md:flex-row align-items-center p-3 w-full" @click="showValueLink($event, slotProps.data.image)">
								<img id="img" :src="slotProps.data.image" :alt="slotProps.data.name" class="my-4 md:my-0 w-9 md:w-10rem shadow-2 mr-5" />
								<div class="flex-1 text-center md:text-left">
									<div class="font-bold text-2xl">{{slotProps.data.name}}</div>
									<div class="mb-3">{{slotProps.data.description}}</div>
									<Rating :modelValue="slotProps.data.rating" :readonly="true" :cancel="false" class="mb-2"></Rating>
									<div class="flex align-items-center">
										<i class="pi pi-tag mr-2"></i>
										<span class="font-semibold">{{slotProps.data.category}}</span>
									</div>

								</div>
								<div class="flex flex-row md:flex-column justify-content-between w-full md:w-auto align-items-center md:align-items-end mt-5 md:mt-0">
									<span class="text-2xl font-semibold mb-2 align-self-center md:align-self-end">${{slotProps.data.price}}</span>
									<Button label="LinkTo" :disabled="slotProps.data.inventoryStatus === 'OUTOFSTOCK'" class="mb-2" @click="linkTo(slotProps.data)"></Button>
									<span :class="'product-badge status-'+slotProps.data.inventoryStatus.toLowerCase()">{{slotProps.data.inventoryStatus}}</span>
								</div>
							</div>
						</div>
					</template>

					<template #grid="slotProps">
						<div class="col-12 md:col-4">
							<div class="card m-3 border-1 surface-border">
								<div class="flex align-items-center justify-content-between">
									<div class="flex align-items-center">
										<i class="pi pi-tag mr-2"></i>
										<span class="font-semibold">{{slotProps.data.category}}</span>
									</div>
									<span :class="'product-badge status-'+slotProps.data.inventoryStatus.toLowerCase()">{{slotProps.data.inventoryStatus}}</span>
								</div>
								<div class="text-center" @click="showValueLink($event, slotProps.data.image)">
									<img id="img" :src="slotProps.data.image" :alt="slotProps.data.name" class="w-9 shadow-2 my-3 mx-0"/>
									<div class="text-2xl font-bold">{{slotProps.data.name}}</div>
									<div class="mb-3">{{slotProps.data.description}}</div>
									<Rating :modelValue="slotProps.data.rating" :readonly="true" :cancel="false"></Rating>
								</div>
								<div class="flex align-items-center justify-content-between">
									<span class="text-2xl font-semibold">${{slotProps.data.price}}</span>
									<Button label="LinkTo" :disabled="slotProps.data.inventoryStatus === 'OUTOFSTOCK'" @click="linkTo(slotProps.data)"></Button>
								</div>
							</div>
						</div>
					</template>
				</DataView>
			</div>
		</div>
	</div>
</template>

<script>
	// import NFTUri from "../common/NFTURi"
	import { useContracts } from '../stores/contracts'

	export default {
		components: {
		},
		data() {
			return {
				contractState: useContracts(),
				dataviewValue: null,
				layout: 'grid',
				categoryKey: null,
				categoryOptions: null,
				valueLinkType: null,
				valueLinkOptions: null,
				loading: false,
				address2Contract: null,
				selectedValueLink: null,
				endNFTUri: null,
				valueLinkContract: null,
				imageDialog: false,
				linkDialog: false,
				imageData: null,
			}
		},
		created() {
			this.categoryOptions = this.contractState.categoryOptions
			this.valueLinkOptions = this.contractState.valueLinkOptions
		},
		methods: {
			async onVLChange(choosedItem){
				this.dataviewValue = null;
				console.log(choosedItem.value, this.valueLinkType)
				const contractWrapper = this.contractState.getContractByName(choosedItem.value)
                this.valueLinkContract = contractWrapper.signer
                await this.listNFTs()
			},
            async listNFTs()  {
				this.loading = true
                const size = await  this.valueLinkContract.totalLinks()
                const list = []
                for (let index = size - 1; index >= 0; index--) {
                    const linkId = await  this.valueLinkContract.linkByIndex(index)
					const metadata = await this.valueLinkContract.linkMetadata(linkId)
					console.log(index, linkId, metadata)
					//we need cross chain service
					const response = await fetch(metadata)
					const metadataObj = await response.json()
                    list.push({
							"id": "" + linkId,
							"code": "v435nn85n",
							"name": metadataObj.name,
							"description": metadataObj.description,
							"image": metadataObj.image,
							"price": Math.ceil(Math.random()*10),
							"quantity": 1000,
							"inventoryStatus": "INSTOCK",
							"rating": linkId % 5,
						})
                }
                this.dataviewValue = list;
				this.loading = false;
            },
			showValueLink(e, imageData) {
				if (e.target.id === 'img') {
					console.log('show value link', imageData)
					this.imageDialog = true
					this.imageData = imageData
				}
			},
			linkTo(selectedValueLink) {
				this.selectedValueLink = selectedValueLink
				this.linkDialog = true
			},
            async link() {
				this.loading = true
				console.log(this.selectedValueLink)
                console.log('start link', this.valueLinkType)
				
                const tx = await this.valueLinkContract.transfer(parseInt(this.selectedValueLink.id), this.endNFTUri)
                this.contractState.provider.once(tx.hash, (tx) => {
                    console.log("txed:", tx)
                    this.$toast.add({severity:'info', summary: 'Value Link Minted', detail:'' + tx.transactionHash, life: 5000});
					this.loading = false
                })
                this.$toast.add({severity:'info', summary: 'Value Link Minting', detail:'' + tx.hash, life: 5000});
				this.linkDialog = false
            },
		}
	}
</script>

<style scoped lang="scss">
@import '../assets/demo/badges.scss';
</style>
