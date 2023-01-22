function doMarkdownBreaks(text){
    return text.replace(/\\n/g, '\n')
}
  
function doMarkdownLinks(text) {
    return text.replace(/\[(.*?)\|(.*?)\]/g, function(match, p1, p2) {
        return `<a href="https://outlawstore.co">${p2}</a>`
    });
}

module.exports = {
    doMarkdownBreaks,
    doMarkdownLinks
}