//import FileFormat from '@sketch-hq/sketch-file-format-ts'

// Require all
var sketch: Sketch = require('sketch');

export default function() {


  let document = sketch.Document.getSelectedDocument()
  var avatarID: string

  sketch.UI.getInputFromUser(
    "What is the bot's name?",
    {
      initialValue: 'Answer Bot',
    },
    (err, value) => {
      if (err) {
        // most likely the user canceled the input
        return
      } else {
        var libraries = sketch.Library.getLibraries()
        libraries.forEach(library => {
          var symbolReferences = library.getImportableSymbolReferencesForDocument(document)
          symbolReferences.forEach(importableSymbol => {
            if (importableSymbol.name === '2. system-avatar/3. small/2. image/1. default') {
              console.log("NAME:" + importableSymbol.name)
              avatarID = importableSymbol.id
              console.log("ID:" + avatarID)
            }
          })
        })

        document.getSymbols().forEach(symbolMaster => {
          symbolMaster.getAllInstances().forEach(symbolInstance => {
            if (symbolInstance.overrides.some(override => {
             if (override.value === avatarID) {
                console.log(override.affectedLayer.name)
                return true
              }
            })) {
              symbolInstance.overrides.forEach(override => {
                if(override.property === "stringValue") {
                  if (override.affectedLayer.name === "✏️ label") {
                      if (override.affectedLayer.id === "34C8D8F5-2A7C-4980-B00B-9D04617BDD1A") {
                        console.log(override.affectedLayer.name)
                        override.value = value
                      }
                  }
                }
              })
            }
          })
        });
      }
    }
  )
}
