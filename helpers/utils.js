function getBestQualityPhoto(photo) {
	const {
		photo: { sizes },
	} = photo;
	let bestQualityLink = null;
	let max = 0;

	for (const { height, url } of sizes) {
		if (height > max) {
			bestQualityLink = url;
			max = height;
		}
	}

	return bestQualityLink;
}

module.exports = {
    getBestQualityPhoto
}