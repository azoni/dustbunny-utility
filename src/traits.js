// async function traits(seaport, collectionName){
// 	var collect = ''
//   	try {
// 	    collectionName = collectionName.trim()
// 	    const collect = await seaport.api.getAssets({
// 	      'collection': collectionName,
// 	      'limit': '1'
//     })
//     const COLLECTION_NAME = collectionName
// 	} catch(ex){
// 		return ex
// 	}
// 	return collect
// }
// export default traits
console.log('Traits loaded')
var traits = 0
document.getElementById('addTrait').addEventListener('click', function(){
	var traitDiv = document.getElementById('traitsDiv')
	var property = document.createElement('input')
	var trait = document.createElement('input')
	var traitbid = document.createElement('input')
	var traitbutton = document.createElement('button')
	traitbutton.innerHTML = 'X'
	
	if (traits === 0){
		property.placeholder = 'hat'
		trait.placeholder = 'party hat'
		traitbid.placeholder = '.68'
	} else if(traits === 1) {
		property.placeholder = 'body'
		trait.placeholder = '6 pack'
		traitbid.placeholder = '1.24'
	} else if(traits === 2) {
		property.placeholder = 'eyes'
		trait.placeholder = 'nerd glasses'
		traitbid.placeholder = '5.91'
	} else if(traits === 3) {
		property.placeholder = 'type'
		trait.placeholder = 'robot'
		traitbid.placeholder = '.44'
	} else if(traits === 4) {
		property.placeholder = 'neck accessory'
		trait.placeholder = 'bow tie'
		traitbid.placeholder = '.09'
	} else if(traits === 5) {

	}
	trait.id = 'trait' + traits
	trait.style.width = '100px'
	property.id = 'property' + traits
	property.style.width = '100px'
	traitbid.id = 'trait' + traits + 'bid'
	traitbid.style.width = '40px'

	var br = document.createElement('br')
	traitbutton.addEventListener('click', function(){
		traitDiv.removeChild(property)
		traitDiv.removeChild(traitbutton)
		traitDiv.removeChild(trait)
		traitDiv.removeChild(traitbid)
		traitDiv.removeChild(br)
	})
	traitDiv.appendChild(property)
	traitDiv.appendChild(trait)
	traitDiv.appendChild(traitbid)
	traitDiv.appendChild(traitbutton)
	traitDiv.appendChild(br)
	traits += 1
})
document.getElementById('clearTrait').addEventListener('click', function(){
	removeChilds(document.getElementById('traitsDiv'))
	traits = 0
	console.log('Cleared traits')
})

const removeChilds = (parent) => {
    while (parent.lastChild) {
        parent.removeChild(parent.lastChild);
    }
};