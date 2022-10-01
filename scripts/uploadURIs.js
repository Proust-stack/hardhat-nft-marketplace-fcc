const { storeNFTs } = require("../utils/uploadToNftStorage")

const imagesLocation = "../images/randomNft"
const response = await storeNFTs(imagesLocation)
console.log(response)
