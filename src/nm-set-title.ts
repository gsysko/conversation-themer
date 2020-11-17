// Require all
var sketch: Sketch = require('sketch');

function swapTitle(symbolInstance: SymbolInstance, value: string) {
  if (symbolInstance.master.getLibrary() && symbolInstance.master.getLibrary().name.includes("sunco-header")) {
    console.log("Checking " + symbolInstance.name)
    symbolInstance.overrides.forEach(override => {
      if (override.affectedLayer.name === "✏️Title"){
        override.value = value
      }
    })
  }
}

export default function() {
  sketch.UI.getInputFromUser(
    "What is the new title?",
    {
      initialValue: 'Zendesk',
    },
    (err, value) => {
      if (err) {
        // most likely the user canceled the input
        return
      } else {
        sketch.getSelectedDocument().pages.forEach(page => {
          page.layers.forEach(layer => {
            if (layer.type ==  'SymbolInstance') {
              swapTitle(layer as SymbolInstance, value)
            } else if (layer.type ==  'Artboard' || layer.type == "SymbolMaster") {
              const container = layer as Layer
              container.layers.forEach(layer => {
                if (layer.type == 'SymbolInstance'){
                  swapTitle(layer as SymbolInstance, value)
                }
              })
            }
          })
        })
      }
    }
  )
}
