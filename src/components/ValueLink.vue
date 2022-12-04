<template>
	<div class="grid">
		<div class="col-12">
			<div class="card">
				<h5>Value Link Explorer</h5>
                <Toast />
				<ProgressBar v-if="loading" mode="indeterminate"/>
				<Dialog header="Mint ValueLink" v-model:visible="mintDialog" :breakpoints="{'960px': '75vw'}" :style="{width: '80vw'}" :modal="true">
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
						<Button label="Mint" @click="mint()" icon="pi pi-check" class="p-button-outlined"/>
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
							<div class="flex flex-column md:flex-row align-items-center p-3 w-full">
								<img :src="slotProps.data.image" :alt="slotProps.data.name" class="my-4 md:my-0 w-9 md:w-10rem shadow-2 mr-5" />
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
									<Button label="Mint" :disabled="slotProps.data.inventoryStatus === 'OUTOFSTOCK'" class="mb-2" @click="openMint(slotProps.data)"></Button>
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
								<div class="text-center">
									<img :src="slotProps.data.image" :alt="slotProps.data.name" class="w-9 shadow-2 my-3 mx-0"/>
									<div class="text-2xl font-bold">{{slotProps.data.name}}</div>
									<div class="mb-3">{{slotProps.data.description}}</div>
									<Rating :modelValue="slotProps.data.rating" :readonly="true" :cancel="false"></Rating>
								</div>
								<div class="flex align-items-center justify-content-between">
									<span class="text-2xl font-semibold">${{slotProps.data.price}}</span>
									<Button label="Mint" :disabled="slotProps.data.inventoryStatus === 'OUTOFSTOCK'" @click="openMint(slotProps.data)"></Button>
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
    import NFTService from "../service/NFTService"
	import NFTUri from "../common/NFTURi"
    import axios from 'axios'

	export default {
        inject: ['message', 'ethers'],
		data() {
			return {
				dataviewValue: null,
				layout: 'grid',
				categoryKey: null,
				categoryOptions: [
					{label: 'Identity', value: 'Identity'},
					{label: 'Art', value: 'Art'},
				],
				valueLinkType: null,
				valueLinkOptions: [
					{label: 'Authorization', value: 'Authorization'},
					{label: 'Fans', value: 'Fans'},
				],
                projects: {
                    Identity: (tokenId) => {
                        return 'https://metadata.kprverse.com/metadata/' + tokenId + '.json'
                    },
                    Art: (tokenId) => {
                        return 'https://genesis.mypinata.cloud/ipfs/QmYxuHhAoLT3gAWaq39RKDFRGKiirsxCgryLgrA44cobV1/' + tokenId
                    }
                },
				loading: false,
				address2Contract: null,
				selectedNFT: null,
				endNFTUri: null,
				mintDialog: false
			}
		},
        nftService: null,
        provider: null,
        nftContracts: null,
		async created() {
            this.nftService = new NFTService()
		},
		async mounted() {
            this.nftContracts = {}
			this.address2Contract = {}
            this.provider = new this.ethers.providers.Web3Provider(window.ethereum)
            this.provider.on("block", (blockNumber) => {
                console.log("new block",blockNumber)
            });
            for (const opt of this.categoryOptions) {
                const abi = await this.nftService.getNFT(opt.value);
				const address = await this.nftService.getContractAddress(opt.value)
                this.nftContracts[opt.value] = new this.ethers.Contract(address, abi.abi, this.provider)
				this.address2Contract[address] = this.nftContracts[opt.value]
            }
			for (const opt of this.valueLinkOptions) {
                const abi = await this.nftService.getNFT(opt.value);
				const address = await this.nftService.getContractAddress(opt.value)
                this.nftContracts[opt.value] = new this.ethers.Contract(address, abi.abi, this.provider)
				this.address2Contract[address] = this.nftContracts[opt.value]
            }
		},
		methods: {
			async onVLChange(choosedItem){
                console.log(choosedItem.value)
				this.dataviewValue = null;
                await this.listNFTs()
			},
            async listNFTs()  {
                const contract = this.nftContracts[this.valueLinkType]
                const size = await contract.totalClaims()
				this.loading = true
                const list = []
                for (let index = size - 1; index >= 0; index--) {
                    const startNftUri = await contract.claimByIndex(index)
					const nftUri = NFTUri.parse(startNftUri)
					//we need cross chain service
					console.log('parse', nftUri.toString())
					for (const c of Object.keys(this.address2Contract)) {
						console.log(c)
					}
					const categoryKey = await this.address2Contract[nftUri.contractAddress].name()
					console.log("key", categoryKey)
                    const projectUri = this.projects[categoryKey](nftUri.index)
                    console.log(projectUri)
                    const resp = await axios.get(projectUri)
                    console.log(resp)
                    list.push({
                        "id": "" + nftUri.index,
                        "code": "v435nn85n",
                        "name": resp.data.name,
                        "description": `Owned by`,
                        "image": resp.data.image,
                        "price": Math.ceil(Math.random()*10),
                        "category": `${this.valueLinkType} from ${categoryKey}`,
						"quantity": 1000,
                        "inventoryStatus": "INSTOCK",
                        "rating": parseInt(nftUri.index) % 5,
						"uri": nftUri
                    })
                }
                this.dataviewValue = list;
				this.loading = false;
            },
			openMint(selectedNFT) {
				this.selectedNFT = selectedNFT.uri
				this.mintDialog = true
			},
            async mint() {
				console.log(this.selectedNFT)
                const signer = this.provider.getSigner()
                const contract = this.nftContracts[this.valueLinkType]
                console.log('start mint', this.valueLinkType)
                const total = await contract.outLinksNumOf(this.selectedNFT.toString())
                console.log('minting', total.toNumber())
                const withSigner = contract.connect(signer)
                const tx = await withSigner.mint(this.selectedNFT.toString(), this.endNFTUri)
                this.provider.once(tx.hash, (tx) => {
                    console.log("txed:", tx)
                    this.$toast.add({severity:'info', summary: 'Value Link Minted', detail:'' + tx.transactionHash, life: 5000});
                })
                this.$toast.add({severity:'info', summary: 'Value Link Minting', detail:'' + tx.hash, life: 5000});
				this.mintDialog = false
            }
		}
	}
</script>

<style scoped lang="scss">
@import '../assets/demo/badges.scss';
</style>
